import { randomUUID } from 'crypto';
import Decimal from 'decimal.js';
import { ContractBasis, OrderItemType } from '@repo/types';
import { BundleSnapshot } from './bundle-snapshot.entity';
import { OrderItemOwnerSplit, SplitStatus } from './order-item-owner-split.entity';
import { ManualPricingOverride } from '../value-objects/manual-pricing-override.value-object';
import { PriceSnapshot } from '../value-objects/price-snapshot.value-object';

export interface CreateOrderItemProps {
  orderId: string;
  type: OrderItemType;
  priceSnapshot: PriceSnapshot;
  manualPricingOverride?: ManualPricingOverride | null;
  productTypeId?: string;
  bundleId?: string;
  bundleSnapshot?: BundleSnapshot;
}

export interface ReconstituteOrderItemProps {
  id: string;
  orderId: string;
  type: OrderItemType;
  priceSnapshot: PriceSnapshot;
  manualPricingOverride: ManualPricingOverride | null;
  productTypeId: string | null;
  bundleId: string | null;
  bundleSnapshot: BundleSnapshot | null;
  ownerSplits: OrderItemOwnerSplit[];
}

export interface AssignOwnerSplitProps {
  assetId: string;
  ownerId: string;
  contractId: string;
  ownerShare: Decimal;
  rentalShare: Decimal;
  basis: ContractBasis;
  productTypeId: string; // used for bundle pro-rata attribution
}

export class OrderItem {
  private constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly type: OrderItemType,
    private _priceSnapshot: PriceSnapshot,
    private _manualPricingOverride: ManualPricingOverride | null,
    public readonly productTypeId: string | null,
    public readonly bundleId: string | null,
    public readonly bundleSnapshot: BundleSnapshot | null,
    private readonly _ownerSplits: OrderItemOwnerSplit[],
  ) {}

  static create(props: CreateOrderItemProps): OrderItem {
    return new OrderItem(
      randomUUID(),
      props.orderId,
      props.type,
      props.priceSnapshot,
      props.manualPricingOverride ?? null,
      props.productTypeId ?? null,
      props.bundleId ?? null,
      props.bundleSnapshot ?? null,
      [],
    );
  }

  static reconstitute(props: ReconstituteOrderItemProps): OrderItem {
    return new OrderItem(
      props.id,
      props.orderId,
      props.type,
      props.priceSnapshot,
      props.manualPricingOverride,
      props.productTypeId,
      props.bundleId,
      props.bundleSnapshot,
      props.ownerSplits,
    );
  }

  get ownerSplits(): OrderItemOwnerSplit[] {
    return [...this._ownerSplits];
  }

  get priceSnapshot(): PriceSnapshot {
    return this._priceSnapshot;
  }

  get calculatedPriceSnapshot(): PriceSnapshot {
    return this._priceSnapshot;
  }

  get manualPricingOverride(): ManualPricingOverride | null {
    return this._manualPricingOverride;
  }

  get hasManualPricingOverride(): boolean {
    return this._manualPricingOverride !== null;
  }

  get effectiveFinalPrice(): Decimal {
    return this._manualPricingOverride?.finalPrice ?? this._priceSnapshot.finalPrice;
  }

  get effectivePricePerBillingUnit(): Decimal {
    if (this._priceSnapshot.totalUnits <= 0) {
      return this._priceSnapshot.pricePerBillingUnit;
    }

    return this.effectiveFinalPrice.div(this._priceSnapshot.totalUnits).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  effectiveDiscountAmount(): Decimal {
    return this._priceSnapshot.basePrice.minus(this.effectiveFinalPrice);
  }

  isBundle(): boolean {
    return this.type === OrderItemType.BUNDLE;
  }

  isProduct(): boolean {
    return this.type === OrderItemType.PRODUCT;
  }

  /**
   * Assigns an owner split for a specific asset on this order item.
   *
   * For PRODUCT items: netAmount is the item's effective final price directly.
   * For BUNDLE items: netAmount is the pro-rata attributed price for the
   * specific component (productTypeId), computed from the bundle snapshot.
   *
   * The @@unique([orderItemId, assetId]) DB constraint is the safety net
   * against duplicate splits for the same asset. The domain does not
   * re-check this — it would require loading all existing splits.
   *
   * grossAmount is always the item's basePrice — before discounts.
   * The owner shares any discount or surcharge burden in both cases.
   */
  assignOwnerSplit(props: AssignOwnerSplitProps): void {
    const grossAmount = this.priceSnapshot.basePrice;
    const effectiveFinalPrice = this.effectiveFinalPrice;

    const netAmount = this.isBundle()
      ? this.bundleSnapshot!.attributedPriceFor(props.productTypeId, effectiveFinalPrice)
      : effectiveFinalPrice;

    const ownerAmount = netAmount.times(props.ownerShare);
    const rentalAmount = netAmount.times(props.rentalShare);

    const split = OrderItemOwnerSplit.create({
      orderItemId: this.id,
      assetId: props.assetId,
      ownerId: props.ownerId,
      contractId: props.contractId,
      ownerShare: props.ownerShare,
      rentalShare: props.rentalShare,
      basis: props.basis,
      grossAmount,
      netAmount,
      ownerAmount,
      rentalAmount,
    });

    this._ownerSplits.push(split);
  }

  /**
   * Voids the split for a specific asset.
   * Called when a specific asset assignment is removed from this item.
   * No-op if no split exists for this asset — rental-owned asset.
   */
  voidOwnerSplitForAsset(assetId: string): void {
    const split = this._ownerSplits.find((s) => s.assetId === assetId);
    if (!split) return;
    split.void();
  }

  /**
   * Voids all splits on this item.
   * Called when the entire order is cancelled.
   */
  voidAllOwnerSplits(): void {
    this._ownerSplits.forEach((s) => {
      if (s.status !== SplitStatus.VOID) {
        s.void();
      }
    });
  }

  replaceManualPricingOverride(manualPricingOverride: ManualPricingOverride | null): void {
    this._manualPricingOverride = manualPricingOverride;
  }
}
