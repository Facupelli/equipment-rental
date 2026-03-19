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
  ConflictGroup,
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

type ResolvedProductItem = {
  type: 'PRODUCT';
  productTypeId: string;
  quantity: number;
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

// ── Demand types ─────────────────────────────────────────────────────────────
// One DemandUnit per physical asset unit required across the entire order.
// resolvedAssetId is written by resolveAssets() and read by the domain builder.
// Binding asset IDs to units (rather than a shared pool) makes the data flow
// explicit and order-independent — no implicit pop mechanic.

type DemandUnit = {
  productTypeId: string;
  locationId: string;
  period: DateRange;
  pinnedAssetId?: string;
  provenance: { type: 'PRODUCT'; productTypeId: string } | { type: 'BUNDLE'; bundleId: string };
  resolvedAssetId?: string;
};

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

      // ── Phase 1: aggregate demand ──────────────────────────────────────
      // One DemandUnit per physical unit needed across all items and bundle
      // components. No DB access yet — pure data transformation.

      const demandUnits = this.buildDemandUnits(resolvedItems);

      // ── Phase 2: resolve assets ────────────────────────────────────────
      // Groups units by productTypeId and resolves all asset IDs in bulk.
      // Writes resolvedAssetId onto each unit in place.
      // Returns the list of provenances that could not be fulfilled.

      const { unavailableItems, conflictGroups } = await this.resolveAssets(demandUnits);

      if (unavailableItems.length > 0 || conflictGroups.length > 0) {
        return err(new OrderItemUnavailableError(unavailableItems, conflictGroups));
      }

      // ── Phase 3: build domain objects ──────────────────────────────────
      // All asset IDs are already bound to their DemandUnits.
      // We slice the unit list per item using an index cursor so each item
      // consumes exactly the units it contributed in Phase 1.

      let unitCursor = 0;

      const pendingAssignments: AssetAssignment[] = [];

      for (const item of resolvedItems) {
        if (item.type === 'PRODUCT') {
          const units = demandUnits.slice(unitCursor, unitCursor + item.quantity);
          unitCursor += item.quantity;

          for (const unit of units) {
            const orderItem = OrderItem.create({
              orderId: order.id,
              type: OrderItemType.PRODUCT,
              priceSnapshot: toPriceSnapshot(item.price, item.currency),
              productTypeId: item.productTypeId,
            });

            order.addItem(orderItem);

            pendingAssignments.push(
              AssetAssignment.create({
                assetId: unit.resolvedAssetId!,
                period: item.period,
                type: AssignmentType.ORDER,
                source: AssignmentSource.OWNED,
                orderId: order.id,
                orderItemId: orderItem.id,
              }),
            );
          }
        } else {
          const totalComponentUnits = item.bundle.components.reduce((sum, c) => sum + c.quantity, 0);
          const units = demandUnits.slice(unitCursor, unitCursor + totalComponentUnits);
          unitCursor += totalComponentUnits;

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

          for (const unit of units) {
            pendingAssignments.push(
              AssetAssignment.create({
                assetId: unit.resolvedAssetId!,
                period: item.period,
                type: AssignmentType.ORDER,
                source: AssignmentSource.OWNED,
                orderId: order.id,
                orderItemId: orderItemWithSnapshot.id,
              }),
            );
          }
        }
      }

      order.transitionTo(OrderStatus.SOURCED);
      await this.orderRepo.save(order, tx);

      const saveResults = await Promise.all(
        pendingAssignments.map((assignment) => this.inventoryApi.saveAssignment(assignment, tx)),
      );

      if (saveResults.some((r) => r.isErr())) {
        // EXCLUDE violation at write time — a race condition with a concurrent
        // order, not a self-collision. The application-level check above
        // eliminates self-collisions; only true concurrency reaches here.
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
              quantity: item.quantity ?? 1,
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

  private buildCategoryCountMap(
    command: CreateOrderCommand,
    metas: Awaited<ReturnType<typeof this.loadItemMetadata>>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of command.items) {
      if (item.type !== 'PRODUCT') continue;

      const meta = metas.products.get(item.productTypeId);
      if (!meta?.categoryId) continue;

      counts[meta.categoryId] = (counts[meta.categoryId] ?? 0) + (item.quantity ?? 1);
    }

    return counts;
  }

  // ── Private: Phase 1 — build demand units ───────────────────────────────
  // Emits one DemandUnit per physical asset unit needed across all items.
  // Preserves insertion order so the Phase 3 cursor-slice pattern is valid.

  private buildDemandUnits(resolvedItems: ResolvedItem[]): DemandUnit[] {
    const units: DemandUnit[] = [];

    for (const item of resolvedItems) {
      if (item.type === 'PRODUCT') {
        for (let i = 0; i < item.quantity; i++) {
          units.push({
            productTypeId: item.productTypeId,
            locationId: item.locationId,
            period: item.period,
            pinnedAssetId: item.assetId,
            provenance: { type: 'PRODUCT', productTypeId: item.productTypeId },
          });
        }
      } else {
        for (const component of item.bundle.components) {
          for (let i = 0; i < component.quantity; i++) {
            units.push({
              productTypeId: component.productTypeId,
              locationId: item.locationId,
              period: item.period,
              provenance: { type: 'BUNDLE', bundleId: item.bundleId },
            });
          }
        }
      }
    }

    return units;
  }

  // ── Private: Phase 2 — resolve assets ───────────────────────────────────
  // Groups DemandUnits by productTypeId. Within each group:
  //   1. Resolves pinned units first (assetId fixed by the caller).
  //      A pinned failure is absolute — that specific asset is unavailable.
  //   2. Resolves free-choice units in a single bulk query, excluding
  //      already-resolved pinned IDs.
  //      A free-choice shortage is classified as:
  //        - absolute (unavailableItems)  if availableCount === 0
  //        - contention (conflictGroups)  if availableCount > 0 but < requestedCount
  //
  // Writes resolvedAssetId onto each unit in place.
  // Returns two de-duplicated buckets for the caller to surface to the client.

  private async resolveAssets(
    demandUnits: DemandUnit[],
  ): Promise<{ unavailableItems: UnavailableItem[]; conflictGroups: ConflictGroup[] }> {
    const groups = new Map<string, DemandUnit[]>();

    for (const unit of demandUnits) {
      const group = groups.get(unit.productTypeId) ?? [];
      group.push(unit);
      groups.set(unit.productTypeId, group);
    }

    const absoluteProvenances: DemandUnit['provenance'][] = [];
    const conflictGroups: ConflictGroup[] = [];

    for (const [productTypeId, units] of groups) {
      const pinnedUnits = units.filter((u) => u.pinnedAssetId != null);
      const freeUnits = units.filter((u) => u.pinnedAssetId == null);

      // All units in a group share the same locationId and period.
      const { locationId, period } = units[0];

      // ── Step 1: resolve pinned units ───────────────────────────────────
      // Validate each pinned asset is still available for the period.
      // A failure here is absolute — the customer asked for a specific asset
      // that is no longer free. There is nothing to choose between.

      const resolvedPinnedIds: string[] = [];

      for (const unit of pinnedUnits) {
        const ids = await this.inventoryApi.findAvailableAssetIds({
          productTypeId,
          locationId,
          period,
          quantity: 1,
          assetId: unit.pinnedAssetId,
        });

        if (ids.length === 0) {
          absoluteProvenances.push(unit.provenance);
        } else {
          unit.resolvedAssetId = ids[0];
          resolvedPinnedIds.push(ids[0]);
        }
      }

      // ── Step 2: resolve free-choice units ─────────────────────────────
      // Single bulk query for all free units, excluding pinned IDs already
      // claimed above so the same asset cannot satisfy two slots.
      //
      // On shortage, classify by availableCount:
      //   0        → absolute unavailability  → unavailableItems bucket
      //   1..N-1   → self-contention          → conflictGroups bucket
      //
      // requestedCount is total group demand (pinned + free) so the customer
      // sees "you need 3, only 2 exist" rather than a confusing partial count.

      if (freeUnits.length > 0) {
        const ids = await this.inventoryApi.findAvailableAssetIds({
          productTypeId,
          locationId,
          period,
          quantity: freeUnits.length,
          excludeAssetIds: resolvedPinnedIds,
        });

        if (ids.length < freeUnits.length) {
          const affectedProvenances = freeUnits.map((u) => u.provenance);

          if (ids.length === 0) {
            // Nothing available at all — absolute failure for all free units.
            for (const provenance of affectedProvenances) {
              absoluteProvenances.push(provenance);
            }
          } else {
            // Some assets exist but not enough — the customer's own items are
            // competing. Surface as a conflict so the UI can ask them to choose.
            conflictGroups.push({
              productTypeId,
              availableCount: ids.length,
              requestedCount: units.length,
              affectedItems: deduplicateProvenances(affectedProvenances),
            });
          }
        } else {
          freeUnits.forEach((unit, idx) => {
            unit.resolvedAssetId = ids[idx];
          });
        }
      }
    }

    return {
      unavailableItems: deduplicateProvenances(absoluteProvenances),
      conflictGroups,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Accepts a raw provenance list (may contain duplicates) and returns a
// de-duplicated UnavailableItem array. Used for both the absolute and
// contention buckets — a bundle with two failing components should appear once.

function deduplicateProvenances(provenances: DemandUnit['provenance'][]): UnavailableItem[] {
  const seen = new Set<string>();
  const result: UnavailableItem[] = [];

  for (const p of provenances) {
    const key = p.type === 'PRODUCT' ? `PRODUCT:${p.productTypeId}` : `BUNDLE:${p.bundleId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(
        p.type === 'PRODUCT'
          ? { type: 'PRODUCT', productTypeId: p.productTypeId }
          : { type: 'BUNDLE', bundleId: p.bundleId },
      );
    }
  }

  return result;
}
