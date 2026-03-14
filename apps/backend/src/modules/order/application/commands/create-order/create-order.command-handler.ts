import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssignmentSource, AssignmentType, OrderItemType, OrderStatus, ScheduleSlotType } from '@repo/types';
import { err, ok, Result } from 'src/core/result';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetAssignment } from 'src/modules/inventory/domain/entities/asset-assignment.entity';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import {
  InvalidPickupSlotError,
  InvalidReturnSlotError,
  OrderItemUnavailableError,
  UnavailableItem,
} from 'src/modules/order/domain/exceptions/order.exceptions';
import { OrderRepositoryPort } from 'src/modules/order/domain/ports/order.repository.port';
import { toPriceSnapshot } from 'src/modules/order/infrastructure/persistence/mappers/price-snapshot.mapper';
import { BundleWithComponents, OrderQueryService } from 'src/modules/order/infrastructure/services/order-query.service';
import { PricingPublicApi } from 'src/modules/pricing/pricing.public-api';
import { TenantPublicApi } from 'src/modules/tenant/tenant.public-api';
import { CreateOrderCommand } from './create-order.command';

// ── Resolved item types ──────────────────────────────────────────────────────
// These types unify command data, loaded metadata, and calculated prices into a
// single object per item. Private methods receive only what they need — no
// command passing, no positional array lookups.

type ResolvedProductItem = {
  type: 'PRODUCT';
  productTypeId: string;
  assetId?: string;
  locationId: string;
  period: DateRange;
  currency: string;
  price: Awaited<ReturnType<typeof PricingPublicApi.prototype.calculateProductPrice>>;
};

type ResolvedBundleItem = {
  type: 'BUNDLE';
  bundleId: string;
  bundle: BundleWithComponents;
  locationId: string;
  period: DateRange;
  currency: string;
  price: Awaited<ReturnType<typeof PricingPublicApi.prototype.calculateBundlePrice>>;
};

type ResolvedItem = ResolvedProductItem | ResolvedBundleItem;

// ── Internal types ───────────────────────────────────────────────────────────

type PendingAssignment = {
  assignment: AssetAssignment;
};

type ReservationResult =
  | { ok: true; pendingAssignments: PendingAssignment[] }
  | { ok: false; unavailableItem: UnavailableItem };

type CreateOrderError = OrderItemUnavailableError | InvalidPickupSlotError | InvalidReturnSlotError;

// ── Handler ──────────────────────────────────────────────────────────────────

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, Result<string>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderRepo: OrderRepositoryPort,
    private readonly tenantApi: TenantPublicApi,
    private readonly inventoryApi: InventoryPublicApi,
    private readonly pricingApi: PricingPublicApi,
    private readonly orderQuery: OrderQueryService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<string, CreateOrderError>> {
    if (command.items.length === 0) {
      throw new BadRequestException('An order must contain at least one item.');
    }

    const validation = await this.validateSlots(command);
    if (validation.isErr()) return validation;

    const period = await this.derivePeriod(command);
    const resolvedItems = await this.resolveItems(command, period);

    return this.prisma.client.$transaction(async (tx) => {
      const order = Order.create({
        tenantId: command.tenantId,
        locationId: command.locationId,
        customerId: command.customerId ?? undefined,
      });

      const reservationResults = await Promise.all(
        resolvedItems.map((item) =>
          item.type === 'PRODUCT' ? this.reserveProductItem(order, item) : this.reserveBundleItem(order, item),
        ),
      );

      const unavailableItems = reservationResults
        .filter((r): r is { ok: false; unavailableItem: UnavailableItem } => !r.ok)
        .map((r) => r.unavailableItem);

      if (unavailableItems.length > 0) {
        return err(new OrderItemUnavailableError(unavailableItems));
      }

      const pendingAssignments = reservationResults
        .filter((r): r is { ok: true; pendingAssignments: PendingAssignment[] } => r.ok)
        .flatMap((r) => r.pendingAssignments);

      order.transitionTo(OrderStatus.SOURCED);
      await this.orderRepo.save(order, tx);

      const saveResults = await Promise.all(
        pendingAssignments.map(({ assignment }) => this.inventoryApi.saveAssignment(assignment, tx)),
      );

      if (saveResults.some((r) => r.isErr())) {
        // EXCLUDE violation at write time — a race condition, not a user error.
        // We don't know which item lost the race, so we report all items as a
        // generic conflict rather than surfacing partial information.
        return err(
          new OrderItemUnavailableError(
            resolvedItems.map((item) =>
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

  // ── Private: slot validation ─────────────────────────────────────────────
  // Business rule: pickup and return times must match the location's configured
  // schedule. Returns err so the controller can translate to a structured HTTP
  // response — these are valid domain errors, not malformed requests.

  private async validateSlots(
    command: CreateOrderCommand,
  ): Promise<Result<void, InvalidPickupSlotError | InvalidReturnSlotError>> {
    const [pickupSlots, returnSlots] = await Promise.all([
      this.tenantApi.getLocationScheduleSlots({
        locationId: command.locationId,
        date: command.period.start,
        type: ScheduleSlotType.PICKUP,
      }),
      this.tenantApi.getLocationScheduleSlots({
        locationId: command.locationId,
        date: command.period.end,
        type: ScheduleSlotType.RETURN,
      }),
    ]);

    if (!pickupSlots.includes(command.pickupTime)) {
      return err(new InvalidPickupSlotError(command.pickupTime));
    }

    if (!returnSlots.includes(command.returnTime)) {
      return err(new InvalidReturnSlotError(command.returnTime));
    }

    return ok(undefined);
  }

  // ── Private: period derivation ───────────────────────────────────────────
  // Derives the rental DateRange from wall-clock slot times + tenant timezone.
  // Separated from validateSlots so each method has a single responsibility.

  private async derivePeriod(command: CreateOrderCommand): Promise<DateRange> {
    const tenantConfig = await this.tenantApi.getConfig(command.tenantId);

    return DateRange.fromLocalSlots(
      command.period.start,
      command.pickupTime,
      command.period.end,
      command.returnTime,
      tenantConfig.timezone,
    );
  }

  // ── Private: item resolution ─────────────────────────────────────────────
  // Loads metadata and prices, then zips them with command data into ResolvedItems.
  // This is the single place where the three parallel structures are unified.
  // All subsequent steps operate on ResolvedItem — no command passing downstream.

  private async resolveItems(command: CreateOrderCommand, period: DateRange): Promise<ResolvedItem[]> {
    const metas = await this.loadItemMetadata(command);
    const orderItemCountByCategory = this.buildCategoryCountMap(command, metas);

    return Promise.all(
      command.items.map((item): Promise<ResolvedItem> => {
        if (item.type === 'PRODUCT') {
          return this.pricingApi
            .calculateProductPrice({
              tenantId: command.tenantId,
              locationId: command.locationId,
              productTypeId: item.productTypeId,
              period,
              currency: command.currency,
              orderItemCountByCategory,
            })
            .then((price) => ({
              type: 'PRODUCT' as const,
              productTypeId: item.productTypeId,
              assetId: item.assetId,
              locationId: command.locationId,
              period,
              currency: command.currency,
              price,
            }));
        } else {
          return this.pricingApi
            .calculateBundlePrice({
              tenantId: command.tenantId,
              locationId: command.locationId,
              bundleId: item.bundleId,
              period,
              currency: command.currency,
              orderItemCountByCategory,
            })
            .then((price) => ({
              type: 'BUNDLE' as const,
              bundleId: item.bundleId,
              bundle: metas.bundles.get(item.bundleId)!,
              locationId: command.locationId,
              period,
              currency: command.currency,
              price,
            }));
        }
      }),
    );
  }

  // ── Private: metadata loading ────────────────────────────────────────────

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

    productTypeIds.forEach((id, idx) => {
      if (!productMetas[idx]) throw new NotFoundException(`ProductType "${id}" not found.`);
    });

    bundleIds.forEach((id, idx) => {
      if (!bundleMetas[idx]) throw new NotFoundException(`Bundle "${id}" not found.`);
    });

    return {
      products: new Map(productTypeIds.map((id, idx) => [id, productMetas[idx]!])),
      bundles: new Map(bundleIds.map((id, idx) => [id, bundleMetas[idx]!])),
    };
  }

  // ── Private: category count map ──────────────────────────────────────────
  // Required for VOLUME pricing rule evaluation.
  // Only PRODUCT items contribute — bundle items use bundle-level pricing.

  private buildCategoryCountMap(
    command: CreateOrderCommand,
    metas: Awaited<ReturnType<typeof this.loadItemMetadata>>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of command.items) {
      if (item.type !== 'PRODUCT') continue;

      const meta = metas.products.get(item.productTypeId);
      if (!meta?.categoryId) continue;

      counts[meta.categoryId] = (counts[meta.categoryId] ?? 0) + 1;
    }

    return counts;
  }

  // ── Private: product item reservation ───────────────────────────────────

  private async reserveProductItem(order: Order, item: ResolvedProductItem): Promise<ReservationResult> {
    const assetId = await this.inventoryApi.findAvailableAssetId({
      productTypeId: item.productTypeId,
      locationId: item.locationId,
      period: item.period,
      assetId: item.assetId,
    });

    if (!assetId) {
      return { ok: false, unavailableItem: { type: 'PRODUCT', productTypeId: item.productTypeId } };
    }

    const orderItem = OrderItem.create({
      orderId: order.id,
      type: OrderItemType.PRODUCT,
      priceSnapshot: toPriceSnapshot(item.price, item.currency),
      productTypeId: item.productTypeId,
    });

    order.addItem(orderItem);

    return {
      ok: true,
      pendingAssignments: [
        {
          assignment: AssetAssignment.create({
            assetId,
            period: item.period,
            type: AssignmentType.ORDER,
            source: AssignmentSource.OWNED,
            orderId: order.id,
            orderItemId: orderItem.id,
          }),
        },
      ],
    };
  }

  // ── Private: bundle item reservation ────────────────────────────────────

  private async reserveBundleItem(order: Order, item: ResolvedBundleItem): Promise<ReservationResult> {
    // ── Step 1: reserve assets ───────────────────────────────────────────
    // Collect all asset IDs before building any domain objects.
    // Exit early if any component is unavailable.

    const reservedAssetIds: string[] = [];

    for (const component of item.bundle.components) {
      for (let qty = 0; qty < component.quantity; qty++) {
        const assetId = await this.inventoryApi.findAvailableAssetId({
          productTypeId: component.productTypeId,
          locationId: item.locationId,
          period: item.period,
        });

        if (!assetId) {
          return { ok: false, unavailableItem: { type: 'BUNDLE', bundleId: item.bundleId } };
        }

        reservedAssetIds.push(assetId);
      }
    }

    // ── Step 2: build domain objects bottom-up ───────────────────────────
    // Components first — they carry no parent reference.
    // OrderItem next — generates its own ID; all downstream objects derive from it.
    // Snapshot last — receives orderItem.id.

    const snapshotComponents = item.bundle.components.map((c) =>
      BundleSnapshotComponent.create({
        productTypeId: c.productTypeId,
        productTypeName: c.productTypeName,
        quantity: c.quantity,
      }),
    );

    const orderItem = OrderItem.create({
      orderId: order.id,
      type: OrderItemType.BUNDLE,
      priceSnapshot: toPriceSnapshot(item.price, item.currency),
      bundleId: item.bundleId,
    });

    const snapshot = BundleSnapshot.create({
      orderItemId: orderItem.id,
      bundleId: item.bundle.id,
      bundleName: item.bundle.name,
      bundlePrice: item.price.finalPrice.toDecimal(),
      components: snapshotComponents,
    });

    // OrderItem is immutable — reconstitute with snapshot attached.
    // Avoids a mutable `attachSnapshot` method on the entity.
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

    return {
      ok: true,
      pendingAssignments: reservedAssetIds.map((assetId) => ({
        assignment: AssetAssignment.create({
          assetId,
          period: item.period,
          type: AssignmentType.ORDER,
          source: AssignmentSource.OWNED,
          orderId: order.id,
          orderItemId: orderItemWithSnapshot.id,
        }),
      })),
    };
  }
}
