import { PricingAdjustmentSourceKind, PromotionAdjustmentType } from '@repo/types';
import Decimal from 'decimal.js';

// ---------------------------------------------------------------------------
// PriceSnapshot — Value Object
// ---------------------------------------------------------------------------
// Immutable record of how a price was calculated at order time.
// Owned by OrderItem. Persisted as a JSON column.
//
// Structural equality: two snapshots are equal if all fields match.
// This VO intentionally does not reference live Promotion entities —
// it is a self-contained audit record, decoupled from the current promotion state.
// ---------------------------------------------------------------------------

export type DiscountLineItem = {
  sourceKind: PricingAdjustmentSourceKind;
  sourceId: string;
  label: string;
  type: PromotionAdjustmentType;
  value: number; // configured promotion value — e.g. 10 for 10%, 20 for $20 flat
  discountAmount: Decimal; // actual money deducted for this promotion
};

export interface PriceSnapshotProps {
  currency: string;
  basePrice: Decimal;
  finalPrice: Decimal;
  totalUnits: number;
  pricePerBillingUnit: Decimal;
  discounts: DiscountLineItem[];
}

export class PriceSnapshot {
  readonly currency: string;
  readonly basePrice: Decimal;
  readonly finalPrice: Decimal;
  readonly totalUnits: number;
  readonly pricePerBillingUnit: Decimal;
  readonly discounts: DiscountLineItem[];

  private constructor(props: PriceSnapshotProps) {
    this.currency = props.currency;
    this.basePrice = props.basePrice;
    this.finalPrice = props.finalPrice;
    this.totalUnits = props.totalUnits;
    this.pricePerBillingUnit = props.pricePerBillingUnit;
    this.discounts = props.discounts;
  }

  static create(props: PriceSnapshotProps): PriceSnapshot {
    return new PriceSnapshot(props);
  }

  // ── Serialization ─────────────────────────────────────────────────────────
  // Called by the mapper when writing to the DB Json column.

  toJSON(): object {
    return {
      currency: this.currency,
      basePrice: this.basePrice.toString(),
      finalPrice: this.finalPrice.toString(),
      totalUnits: this.totalUnits,
      pricePerBillingUnit: this.pricePerBillingUnit.toString(),
      discounts: this.discounts.map((d) => ({
        sourceKind: d.sourceKind,
        sourceId: d.sourceId,
        label: d.label,
        type: d.type,
        value: d.value,
        discountAmount: d.discountAmount.toString(),
      })),
    };
  }

  // ── Deserialization ───────────────────────────────────────────────────────
  // Called by the mapper when reading from the DB Json column.
  // Reconstitution skips validation — data from the DB is already trusted.

  static fromJSON(raw: unknown): PriceSnapshot {
    const data = raw as Record<string, unknown>;

    return new PriceSnapshot({
      currency: data.currency as string,
      basePrice: new Decimal(data.basePrice as string),
      finalPrice: new Decimal(data.finalPrice as string),
      totalUnits: data.totalUnits as number,
      pricePerBillingUnit: new Decimal(data.pricePerBillingUnit as string),
      // Old persisted snapshots used ruleId/ruleLabel. Keep that read-only fallback here,
      // but always serialize using promotion terminology.
      discounts: (data.discounts as Array<Record<string, unknown>>).map((d) => ({
        sourceKind: (d.sourceKind as PricingAdjustmentSourceKind | undefined) ?? PricingAdjustmentSourceKind.PROMOTION,
        sourceId: (d.sourceId as string | undefined) ?? (d.promotionId as string) ?? (d.ruleId as string),
        label: (d.label as string | undefined) ?? (d.promotionLabel as string) ?? (d.ruleLabel as string),
        type: d.type as PromotionAdjustmentType,
        value: d.value as number,
        discountAmount: new Decimal(d.discountAmount as string),
      })),
    });
  }

  // ── Convenience ───────────────────────────────────────────────────────────

  hasDiscounts(): boolean {
    return this.discounts.length > 0;
  }

  totalDiscountAmount(): Decimal {
    return this.discounts.reduce((sum, d) => sum.add(d.discountAmount), new Decimal(0));
  }
}
