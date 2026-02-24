import { Money } from './money.vo';

export type DayType = 'WEEKDAY' | 'WEEKEND';

/**
 * Represents the pricing calculation for a single day.
 * Stored as an array inside BookingLineItem.priceBreakdown (JSONB).
 */
export interface PriceBreakdownEntry {
  readonly date: Date;
  readonly type: DayType;
  readonly rate: Money; // rate applied for this specific day
}

/**
 * PriceBreakdown Value Object
 *
 * An immutable snapshot of how a line item's price was calculated.
 * Persisted as JSONB so disputes can be resolved without re-running
 * historic pricing logic.
 *
 * Created by PricingEngine, consumed by BookingLineItem.
 */
export class PriceBreakdown {
  readonly entries: ReadonlyArray<PriceBreakdownEntry>;
  readonly billableDays: number;
  readonly total: Money;

  private constructor(entries: PriceBreakdownEntry[]) {
    if (entries.length === 0) {
      throw new Error('PriceBreakdown must have at least one entry.');
    }

    this.entries = Object.freeze([...entries]);
    this.billableDays = entries.length;

    // Derive total by summing all entry rates — single source of truth
    this.total = entries.reduce((sum, entry) => sum.add(entry.rate), Money.zero(entries[0].rate.currency));
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static fromEntries(entries: PriceBreakdownEntry[]): PriceBreakdown {
    return new PriceBreakdown(entries);
  }

  /**
   * Rehydrates a PriceBreakdown from a raw JSONB value stored in Postgres.
   * Called by the repository when loading a booking from persistence.
   */
  static fromJson(raw: unknown, currency: string): PriceBreakdown {
    if (!Array.isArray(raw)) {
      throw new Error('Invalid PriceBreakdown JSON: expected an array.');
    }

    const entries: PriceBreakdownEntry[] = raw.map((entry: any) => ({
      date: new Date(entry.date),
      type: entry.type as DayType,
      rate: Money.of(entry.rate, currency),
    }));

    return new PriceBreakdown(entries);
  }

  // ── Serialization ──────────────────────────────────────────────────────────

  /**
   * Produces the plain object array stored in JSONB.
   * Rates are serialized as strings to preserve Decimal precision.
   */
  toJson(): object[] {
    return this.entries.map((entry) => ({
      date: entry.date.toISOString(),
      type: entry.type,
      rate: entry.rate.amount.toString(),
    }));
  }
}
