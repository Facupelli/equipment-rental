import { Money } from './money.vo';

// =============================================================================
// Domain Types
// =============================================================================

/**
 * A single line in the price breakdown — one per billing unit type used.
 * e.g. { unitName: "full_day", quantity: 2, rateApplied: $80, subtotal: $160 }
 */
export interface PriceBreakdownEntry {
  readonly unitName: string;
  readonly quantity: number;
  readonly rateApplied: Money;
  readonly subtotal: Money;
}

export interface TierSnapshot {
  readonly tierId: string;
  readonly fromUnit: number;
  readonly thresholdHours: number;
  readonly pricePerUnit: Money;
}

// =============================================================================
// Value Object
// =============================================================================

/**
 * PriceBreakdown Value Object
 *
 * An immutable, unit-centric snapshot of how a line item's price was calculated.
 * One entry per billing unit type (e.g. full_day, half_day) — not per calendar day.
 *
 * Persisted as JSONB on BookingLineItem so disputes can be resolved without
 * re-running historic pricing logic.
 *
 * Created by PricingEngine, consumed by BookingLineItem.
 */
export class PriceBreakdown {
  readonly entries: ReadonlyArray<PriceBreakdownEntry>;
  readonly total: Money;
  readonly totalBillableHours: number;
  readonly rawDurationHours: number;
  readonly tierApplied: TierSnapshot;
  readonly calendarAdjustments: ReadonlyArray<CalendarAdjustmentSnapshot>;

  private constructor(
    entries: PriceBreakdownEntry[],
    totalBillableHours: number,
    rawDurationHours: number,
    tierApplied: TierSnapshot,
    calendarAdjustments: CalendarAdjustmentSnapshot[],
  ) {
    if (entries.length === 0) {
      throw new Error('PriceBreakdown must have at least one entry.');
    }

    this.entries = Object.freeze([...entries]);
    this.totalBillableHours = totalBillableHours;
    this.rawDurationHours = rawDurationHours;
    this.tierApplied = Object.freeze(tierApplied);
    this.calendarAdjustments = Object.freeze([...calendarAdjustments]);

    // Derive total by summing subtotals — single source of truth
    this.total = entries.reduce((sum, entry) => sum.add(entry.subtotal), Money.zero(entries[0].rateApplied.currency));
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(props: {
    entries: PriceBreakdownEntry[];
    totalBillableHours: number;
    rawDurationHours: number;
    tierApplied: TierSnapshot;
    calendarAdjustments: CalendarAdjustmentSnapshot[];
  }): PriceBreakdown {
    return new PriceBreakdown(
      props.entries,
      props.totalBillableHours,
      props.rawDurationHours,
      props.tierApplied,
      props.calendarAdjustments,
    );
  }

  /**
   * Rehydrates a PriceBreakdown from a raw JSONB value stored in Postgres.
   * Called by the repository when loading a booking line item from persistence.
   */
  static fromJson(raw: unknown): PriceBreakdown {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Invalid PriceBreakdown JSON: expected an object.');
    }

    const data = raw as Record<string, any>;

    const entries: PriceBreakdownEntry[] = data.entries.map((e: any) => ({
      unitName: e.unitName,
      quantity: e.quantity,
      rateApplied: Money.of(e.rateApplied, data.currency),
      subtotal: Money.of(e.subtotal, data.currency),
    }));

    const tierApplied: TierSnapshot = {
      tierId: data.tierApplied.tierId,
      fromUnit: data.tierApplied.fromUnit,
      thresholdHours: data.tierApplied.thresholdHours,
      pricePerUnit: Money.of(data.tierApplied.pricePerUnit, data.currency),
    };

    return new PriceBreakdown(
      entries,
      data.totalBillableHours,
      data.rawDurationHours,
      tierApplied,
      data.calendarAdjustments ?? [],
    );
  }

  // ── Serialization ──────────────────────────────────────────────────────────

  /**
   * Produces the plain object stored in JSONB.
   * Monetary amounts are serialized as strings to preserve Decimal precision.
   */
  toJson(): object {
    return {
      currency: this.total.currency,
      total: this.total.amount.toString(),
      totalBillableHours: this.totalBillableHours,
      rawDurationHours: this.rawDurationHours,
      tierApplied: {
        tierId: this.tierApplied.tierId,
        fromUnit: this.tierApplied.fromUnit,
        thresholdHours: this.tierApplied.thresholdHours,
        pricePerUnit: this.tierApplied.pricePerUnit.amount.toString(),
      },
      calendarAdjustments: this.calendarAdjustments,
      entries: this.entries.map((e) => ({
        unitName: e.unitName,
        quantity: e.quantity,
        rateApplied: e.rateApplied.amount.toString(),
        subtotal: e.subtotal.amount.toString(),
      })),
    };
  }
}

// =============================================================================
// Supporting Types (mirrored from PricingEngine for snapshot persistence)
// =============================================================================

export interface CalendarAdjustmentSnapshot {
  readonly type: 'WEEKEND_MERGED';
  readonly saturdayDate: string;
  readonly hoursDeducted: number;
}
