import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { OrderRepositoryPort } from 'src/modules/order/domain/ports/order.repository.port';
import { BundleWithComponents, OrderQueryService } from 'src/modules/order/infrastructure/services/order-query.service';
import { PricingPublicApi } from 'src/modules/pricing/pricing.public-api';
import { CreateOrderCommand } from './create-order.command';
import { err, ok, Result } from 'src/core/result';
import { OrderItemUnavailableError, UnavailableItem } from 'src/modules/order/domain/exceptions/order.exceptions';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import { AssignmentSource, AssignmentType, OrderItemType, OrderStatus } from '@repo/types';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssetAssignment } from 'src/modules/inventory/domain/entities/asset-assignment.entity';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { toPriceSnapshot } from 'src/modules/order/infrastructure/persistence/mappers/price-snapshot.mapper';

type PendingAssignment = {
  assignment: AssetAssignment;
};

type ReservationResult =
  | { ok: true; pendingAssignments: PendingAssignment[] }
  | { ok: false; unavailableItem: UnavailableItem };

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, Result<string>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderRepo: OrderRepositoryPort,
    private readonly teanContext: TenantContextService,
    private readonly inventoryApi: InventoryPublicApi,
    private readonly pricingApi: PricingPublicApi,
    private readonly orderQuery: OrderQueryService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<string, OrderItemUnavailableError>> {
    // ── Pre-flight validation ────────────────────────────────────────────────

    if (command.items.length === 0) {
      throw new BadRequestException('An order must contain at least one item.');
    }

    const tenantId = this.teanContext.requireTenantId();

    // ── Pre-flight metadata load ─────────────────────────────────────────────
    // Load all item metadata before opening the transaction.
    // This keeps the transaction window as short as possible.

    const itemMetas = await this.loadItemMetadata(command);

    // ── Pre-compute orderItemCountByCategory ─────────────────────────────────
    // Required for VOLUME pricing rule evaluation.
    // Only PRODUCT items contribute — bundle items use bundle-level pricing.

    const orderItemCountByCategory = this.buildCategoryCountMap(command, itemMetas);

    // ── Calculate prices outside transaction ─────────────────────────────────
    // Pricing is a pure read with no side effects. Calculating outside the
    // transaction reduces lock contention duration.

    const prices = await this.calculatePrices(command, tenantId, orderItemCountByCategory);

    // ── Transaction: reserve assets + persist order atomically ───────────────

    return this.prisma.client.$transaction(async (tx) => {
      const order = Order.create({
        tenantId,
        locationId: command.locationId,
        customerId: command.customerId ?? undefined,
      });

      const reservationResults = await Promise.all(
        command.items.map((itemCommand, i) => {
          const price = prices[i];
          if (itemCommand.type === 'PRODUCT') {
            return this.reserveProductItem(order, itemCommand, price, command);
          } else {
            const bundle = itemMetas.bundles.get(itemCommand.bundleId)!;
            return this.reserveBundleItem(order, itemCommand, bundle, price, command);
          }
        }),
      );

      // Collect all unavailable items before failing — complete picture for the frontend
      const unavailableItems = reservationResults
        .filter((r): r is { ok: false; unavailableItem: UnavailableItem } => !r.ok)
        .map((r) => r.unavailableItem);

      if (unavailableItems.length > 0) {
        return err(new OrderItemUnavailableError(unavailableItems));
      }

      // All succeeded — flatten pending assignments
      const pendingAssignments = reservationResults
        .filter((r): r is { ok: true; pendingAssignments: PendingAssignment[] } => r.ok)
        .flatMap((r) => r.pendingAssignments);

      order.transitionTo(OrderStatus.SOURCED);
      await this.orderRepo.save(order, tx);

      const saveResults = await Promise.all(
        pendingAssignments.map(({ assignment }) => this.inventoryApi.saveAssignment(assignment, tx)),
      );

      const saveFailed = saveResults.find((r) => r.isErr());
      if (saveFailed) {
        // EXCLUDE violation at write time — a race condition, not a user error.
        // We don't know which item lost the race here, so we report all items
        // as a generic conflict rather than surfacing partial information.
        return err(
          new OrderItemUnavailableError(
            command.items.map((item) =>
              item.type === 'PRODUCT'
                ? { type: 'PRODUCT', productTypeId: item.productTypeId }
                : { type: 'BUNDLE', bundleId: item.bundleId },
            ),
          ),
        );
      }

      return ok(order.id);
    });
  }

  // ── Private: metadata loading ─────────────────────────────────────────────

  private async loadItemMetadata(command: CreateOrderCommand) {
    const productTypeIds = command.items
      .filter((i) => i.type === 'PRODUCT')
      .map((i) => (i as { type: 'PRODUCT'; productTypeId: string }).productTypeId);

    const bundleIds = command.items
      .filter((i) => i.type === 'BUNDLE')
      .map((i) => (i as { type: 'BUNDLE'; bundleId: string }).bundleId);

    const [productMetas, bundleMetas] = await Promise.all([
      Promise.all(productTypeIds.map((id) => this.orderQuery.loadProductTypeMeta(id))),
      Promise.all(bundleIds.map((id) => this.orderQuery.loadBundleWithComponents(id))),
    ]);

    // Validate all entities exist
    productTypeIds.forEach((id, idx) => {
      if (!productMetas[idx]) {
        throw new NotFoundException(`ProductType "${id}" not found.`);
      }
    });
    bundleIds.forEach((id, idx) => {
      if (!bundleMetas[idx]) {
        throw new NotFoundException(`Bundle "${id}" not found.`);
      }
    });

    return {
      products: new Map(productTypeIds.map((id, idx) => [id, productMetas[idx]!])),
      bundles: new Map(bundleIds.map((id, idx) => [id, bundleMetas[idx]!])),
    };
  }

  // ── Private: category count map ───────────────────────────────────────────

  private buildCategoryCountMap(
    command: CreateOrderCommand,
    metas: Awaited<ReturnType<typeof this.loadItemMetadata>>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of command.items) {
      if (item.type !== 'PRODUCT') {
        continue;
      }

      const meta = metas.products.get(item.productTypeId);
      if (!meta?.categoryId) {
        continue;
      }
      counts[meta.categoryId] = (counts[meta.categoryId] ?? 0) + 1;
    }

    return counts;
  }

  // ── Private: price calculation ────────────────────────────────────────────

  private async calculatePrices(
    command: CreateOrderCommand,
    tenantId: string,
    orderItemCountByCategory: Record<string, number>,
  ) {
    return Promise.all(
      command.items.map((item) => {
        if (item.type === 'PRODUCT') {
          return this.pricingApi.calculateProductPrice({
            tenantId,
            locationId: command.locationId,
            productTypeId: item.productTypeId,
            period: command.period,
            currency: command.currency,
            orderItemCountByCategory,
          });
        } else {
          return this.pricingApi.calculateBundlePrice({
            tenantId,
            locationId: command.locationId,
            bundleId: item.bundleId,
            period: command.period,
            currency: command.currency,
            orderItemCountByCategory,
          });
        }
      }),
    );
  }

  // ── Private: product item reservation ────────────────────────────────────

  private async reserveProductItem(
    order: Order,
    itemCommand: { type: 'PRODUCT'; productTypeId: string; assetId?: string },
    price: Awaited<ReturnType<typeof this.pricingApi.calculateProductPrice>>,
    command: CreateOrderCommand,
  ): Promise<ReservationResult> {
    const assetId = await this.inventoryApi.findAvailableAssetId({
      productTypeId: itemCommand.productTypeId,
      locationId: command.locationId,
      period: command.period,
      assetId: itemCommand.assetId,
    });

    if (!assetId) {
      return { ok: false, unavailableItem: { type: 'PRODUCT', productTypeId: itemCommand.productTypeId } };
    }

    const orderItem = OrderItem.create({
      orderId: order.id,
      type: OrderItemType.PRODUCT,
      priceSnapshot: toPriceSnapshot(price, command.currency),
      productTypeId: itemCommand.productTypeId,
    });

    order.addItem(orderItem);

    return {
      ok: true,
      pendingAssignments: [
        {
          assignment: AssetAssignment.create({
            assetId,
            period: DateRange.create(command.period.start, command.period.end),
            type: AssignmentType.ORDER,
            source: AssignmentSource.OWNED,
            orderId: order.id,
            orderItemId: orderItem.id,
          }),
        },
      ],
    };
  }

  // ── Private: bundle item reservation ─────────────────────────────────────

  private async reserveBundleItem(
    order: Order,
    itemCommand: { type: 'BUNDLE'; bundleId: string },
    bundle: BundleWithComponents,
    price: Awaited<ReturnType<typeof this.pricingApi.calculateBundlePrice>>,
    command: CreateOrderCommand,
  ): Promise<ReservationResult> {
    const period = DateRange.create(command.period.start, command.period.end);

    // ── Step 1: reserve assets ────────────────────────────────────────────
    // Collect asset IDs upfront. Exit early if any component is unavailable
    // before building any domain objects.

    const reservedAssetIds: string[] = [];

    for (const component of bundle.components) {
      for (let qty = 0; qty < component.quantity; qty++) {
        const assetId = await this.inventoryApi.findAvailableAssetId({
          productTypeId: component.productTypeId,
          locationId: command.locationId,
          period: command.period,
        });

        if (!assetId) {
          return { ok: false, unavailableItem: { type: 'BUNDLE', bundleId: itemCommand.bundleId } };
        }

        reservedAssetIds.push(assetId);
      }
    }

    // ── Step 2: build domain objects bottom-up following ownership ────────
    // Components first — they carry no parent reference in the domain.
    // Snapshot second — receives orderItem.id.
    // OrderItem last — owns the snapshot.
    // Assignments last — reference orderItem.id.

    const snapshotComponents = bundle.components.map((c) =>
      BundleSnapshotComponent.create({
        productTypeId: c.productTypeId,
        productTypeName: c.productTypeName,
        quantity: c.quantity,
      }),
    );

    // OrderItem generates its own ID — all downstream objects derive from it.
    const orderItem = OrderItem.create({
      orderId: order.id,
      type: OrderItemType.BUNDLE,
      priceSnapshot: toPriceSnapshot(price, command.currency),
      bundleId: itemCommand.bundleId,
    });

    const snapshot = BundleSnapshot.create({
      orderItemId: orderItem.id,
      bundleId: bundle.id,
      bundleName: bundle.name,
      bundlePrice: price.finalPrice.toDecimal(),
      components: snapshotComponents,
    });

    // OrderItem is immutable — reconstitute with snapshot attached.
    // This avoids a mutable `attachSnapshot` method on the entity.
    const orderItemWithSnapshot = OrderItem.reconstitute({
      id: orderItem.id,
      orderId: orderItem.orderId,
      type: orderItem.type,
      priceSnapshot: orderItem.priceSnapshot,
      productTypeId: orderItem.productTypeId,
      bundleId: orderItem.bundleId,
      bundleSnapshot: snapshot,
    });

    order.addItem(orderItemWithSnapshot);

    const pendingAssignments: PendingAssignment[] = reservedAssetIds.map((assetId) => ({
      assignment: AssetAssignment.create({
        assetId,
        period,
        type: AssignmentType.ORDER,
        source: AssignmentSource.OWNED,
        orderId: order.id,
        orderItemId: orderItemWithSnapshot.id,
      }),
    }));

    return { ok: true, pendingAssignments };
  }
}
