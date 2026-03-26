import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { AssignmentSource, AssignmentType, OrderItemType, OrderStatus, ScheduleSlotType } from '@repo/types';
import { err, ok, Result } from 'src/core/result';
import Decimal from 'decimal.js';
import { PrismaService } from 'src/core/database/prisma.service';
import { AssetAssignment } from 'src/modules/inventory/domain/entities/asset-assignment.entity';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.value-object';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import { OrderRepositoryPort } from 'src/modules/order/domain/ports/order.repository.port';
import { toPriceSnapshot } from 'src/modules/order/infrastructure/persistence/mappers/price-snapshot.mapper';
import { BundleWithComponents, OrderQueryService } from 'src/modules/order/infrastructure/services/order-query.service';
import { PricingPublicApi } from 'src/modules/pricing/pricing.public-api';
import { TenantPublicApi } from 'src/modules/tenant/tenant.public-api';
import { CreateOrderCommand } from './create-order.command';
import {
  InvalidPickupSlotError,
  ConflictGroup,
  InvalidReturnSlotError,
  NoActiveContractForAssetError,
  OrderItemUnavailableError,
  UnavailableItem,
} from '../../errors/order.errors';
import {
  ActiveContractDto,
  FindActiveContractForScopeQuery,
} from 'src/modules/tenant/owner/application/queries/find-active-owner-contract/find-active-owner-contract.query';
import { CouponApplicationService } from 'src/modules/pricing/application/coupon.application-service';

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
  componentStandalonePrices: Map<string, Decimal>;
};

type ResolvedItem = ResolvedProductItem | ResolvedBundleItem;

// ── Demand types ─────────────────────────────────────────────────────────────

type DemandUnit = {
  productTypeId: string;
  locationId: string;
  period: DateRange;
  pinnedAssetId?: string;
  provenance: { type: 'PRODUCT'; productTypeId: string } | { type: 'BUNDLE'; bundleId: string };
  resolvedAssetId?: string;
};

// ── CHANGED: added NoActiveContractForAssetError to the error union ──────────
type CreateOrderError =
  | OrderItemUnavailableError
  | InvalidPickupSlotError
  | InvalidReturnSlotError
  | NoActiveContractForAssetError;

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
    private readonly couponService: CouponApplicationService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<string, CreateOrderError>> {
    if (command.items.length === 0) {
      throw new BadRequestException('An order must contain at least one item.');
    }

    const validation = await this.validateSlots(command);
    if (validation.isErr()) {
      return validation;
    }

    const now = new Date();
    let resolvedCoupon: { couponId: string; ruleId: string } | undefined;

    if (command.couponCode) {
      resolvedCoupon = await this.couponService.resolveCouponForPricing({
        tenantId: command.tenantId,
        code: command.couponCode,
        customerId: command.customerId,
        now,
      });
    }

    const period = await this.derivePeriod(command);
    const resolvedItems = await this.resolveItems(command, period, resolvedCoupon);

    return this.prisma.client.$transaction(async (tx) => {
      const order = Order.create({
        tenantId: command.tenantId,
        locationId: command.locationId,
        customerId: command.customerId,
      });

      // ── Phase 1: aggregate demand ──────────────────────────────────────

      const demandUnits = this.buildDemandUnits(resolvedItems);

      // ── Phase 2: resolve assets ────────────────────────────────────────

      const { unavailableItems, conflictGroups } = await this.resolveAssets(demandUnits);

      if (unavailableItems.length > 0 || conflictGroups.length > 0) {
        return err(new OrderItemUnavailableError(unavailableItems, conflictGroups));
      }

      // ── CHANGED: batch fetch ownerId for all resolved assets ───────────
      // Single query after Phase 2 when all asset IDs are known.
      // Only external-owned assets (ownerId != null) will need a split.

      const resolvedAssetIds = demandUnits.map((u) => u.resolvedAssetId).filter((id): id is string => id !== undefined);

      const assetOwnerRows = await this.prisma.client.asset.findMany({
        where: { id: { in: resolvedAssetIds } },
        select: { id: true, ownerId: true },
      });

      const ownerByAssetId = new Map<string, string | null>(assetOwnerRows.map((a) => [a.id, a.ownerId]));

      // ── CHANGED: pre-fetch contracts for all external-owned assets ─────
      // Batch contract lookups before the domain builder loop so we can
      // fail fast if any external asset has no active contract — before
      // any domain objects are mutated.

      const contractByAssetId = new Map<string, ActiveContractDto>();
      const bookingDate = command.period.start;

      for (const assetId of resolvedAssetIds) {
        const ownerId = ownerByAssetId.get(assetId) ?? null;
        if (!ownerId) continue;

        const contract = await this.queryBus.execute<FindActiveContractForScopeQuery, ActiveContractDto | null>(
          new FindActiveContractForScopeQuery(command.tenantId, ownerId, assetId, bookingDate),
        );

        if (!contract) {
          return err(new NoActiveContractForAssetError(assetId, ownerId));
        }

        contractByAssetId.set(assetId, contract);
      }

      // ── Phase 3: build domain objects ──────────────────────────────────

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

            // CHANGED: assign owner split if this asset has an external owner
            const contract = contractByAssetId.get(unit.resolvedAssetId!);
            if (contract) {
              orderItem.assignOwnerSplit({
                assetId: unit.resolvedAssetId!,
                ownerId: contract.ownerId,
                contractId: contract.contractId,
                ownerShare: new Decimal(contract.ownerShare),
                rentalShare: new Decimal(contract.rentalShare),
                basis: contract.basis as any,
                productTypeId: item.productTypeId,
              });
            }

            order.addItem(orderItem);

            pendingAssignments.push(
              AssetAssignment.create({
                assetId: unit.resolvedAssetId!,
                period: item.period,
                type: AssignmentType.ORDER,
                source: contractByAssetId.has(unit.resolvedAssetId!)
                  ? AssignmentSource.EXTERNAL // CHANGED: mark external-owned assignments
                  : AssignmentSource.OWNED,
                orderId: order.id,
                orderItemId: orderItem.id,
              }),
            );
          }
        } else {
          const totalComponentUnits = item.bundle.components.reduce((sum, c) => sum + c.quantity, 0);
          const units = demandUnits.slice(unitCursor, unitCursor + totalComponentUnits);
          unitCursor += totalComponentUnits;

          // componentStandalonePrices was already fetched in resolveItems
          // alongside calculateBundlePrice — no extra DB call needed here.
          const snapshotComponents = item.bundle.components.map((c) =>
            BundleSnapshotComponent.create({
              productTypeId: c.productTypeId,
              productTypeName: c.productTypeName,
              quantity: c.quantity,
              pricePerUnit: item.componentStandalonePrices.get(c.productTypeId) ?? new Decimal(0),
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
            ownerSplits: [],
          });

          // CHANGED: assign owner splits for each external-owned component asset
          for (const unit of units) {
            const contract = contractByAssetId.get(unit.resolvedAssetId!);
            if (contract) {
              orderItemWithSnapshot.assignOwnerSplit({
                assetId: unit.resolvedAssetId!,
                ownerId: contract.ownerId,
                contractId: contract.contractId,
                ownerShare: new Decimal(contract.ownerShare),
                rentalShare: new Decimal(contract.rentalShare),
                basis: contract.basis as any,
                productTypeId: unit.productTypeId,
              });
            }
          }

          order.addItem(orderItemWithSnapshot);

          for (const unit of units) {
            pendingAssignments.push(
              AssetAssignment.create({
                assetId: unit.resolvedAssetId!,
                period: item.period,
                type: AssignmentType.ORDER,
                source: contractByAssetId.has(unit.resolvedAssetId!)
                  ? AssignmentSource.EXTERNAL // CHANGED: mark external-owned assignments
                  : AssignmentSource.OWNED,
                orderId: order.id,
                orderItemId: orderItemWithSnapshot.id,
              }),
            );
          }
        }
      }

      order.transitionTo(OrderStatus.SOURCED);
      await this.orderRepo.save(order, tx);

      if (resolvedCoupon) {
        await this.couponService.redeemWithinTransaction(
          {
            couponId: resolvedCoupon.couponId,
            orderId: order.id,
            customerId: command.customerId,
            now,
          },
          tx,
        );
      }

      const saveResults = await Promise.all(
        pendingAssignments.map((assignment) => this.inventoryApi.saveAssignment(assignment, tx)),
      );

      if (saveResults.some((r) => r.isErr())) {
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

  private async resolveItems(
    command: CreateOrderCommand,
    period: DateRange,
    resolvedCoupon: { couponId: string; ruleId: string } | undefined, // ADD
  ): Promise<ResolvedItem[]> {
    const metas = await this.loadItemMetadata(command);
    const orderItemCountByCategory = this.buildCategoryCountMap(command, metas);

    const applicableCouponRuleIds = resolvedCoupon ? [resolvedCoupon.ruleId] : undefined;

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
              applicableCouponRuleIds,
              customerId: command.customerId,
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
          const bundle = metas.bundles.get(item.bundleId)!;
          // Fetch bundle price and component standalone prices in parallel —
          // component prices are one batched DB query regardless of component count.
          return Promise.all([
            this.pricingApi.calculateBundlePrice({
              tenantId: command.tenantId,
              locationId: command.locationId,
              bundleId: item.bundleId,
              period,
              currency: command.currency,
              orderItemCountByCategory,
              applicableCouponRuleIds,
              customerId: command.customerId,
            }),
            this.pricingApi.getComponentStandalonePrices({
              tenantId: command.tenantId,
              locationId: command.locationId,
              componentProductTypeIds: bundle.components.map((c) => c.productTypeId),
              period,
            }),
          ]).then(([price, componentStandalonePrices]) => ({
            type: 'BUNDLE' as const,
            bundleId: item.bundleId,
            bundle,
            locationId: command.locationId,
            period,
            currency: command.currency,
            price,
            componentStandalonePrices,
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

      const { locationId, period } = units[0];

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
            for (const provenance of affectedProvenances) {
              absoluteProvenances.push(provenance);
            }
          } else {
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
