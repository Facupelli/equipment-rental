import Decimal from 'decimal.js';

/**
 * Money Value Object
 *
 * Immutable. All arithmetic returns a new instance.
 * Uses Decimal.js to avoid floating-point precision issues in financial calculations.
 */
export class Money {
  readonly amount: Decimal;
  readonly currency: string;

  private constructor(amount: Decimal | number | string, currency: string) {
    this.amount = new Decimal(amount);
    this.currency = currency.toUpperCase();
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static of(amount: Decimal | number | string, currency: string): Money {
    const value = new Decimal(amount);

    if (value.isNaN()) {
      throw new Error(`Invalid monetary amount: ${amount}`);
    }

    return new Money(value, currency);
  }

  static zero(currency: string): Money {
    return new Money(new Decimal(0), currency);
  }

  // ── Arithmetic (returns new instances) ────────────────────────────────────

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount.plus(other.amount), this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount.minus(other.amount), this.currency);
  }

  multiply(factor: number | Decimal): Money {
    return new Money(this.amount.mul(factor), this.currency);
  }

  /**
   * Returns this value or the provided minimum — whichever is greater.
   * Primary use case: flooring prices at zero so discounts never produce
   * a negative amount.
   */
  clampAbove(min: Money): Money {
    this.assertSameCurrency(min);
    return this.amount.greaterThanOrEqualTo(min.amount) ? this : min;
  }

  // ── Comparison ─────────────────────────────────────────────────────────────

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount.equals(other.amount);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount.greaterThan(other.amount);
  }

  // ── Serialization ──────────────────────────────────────────────────────────

  /**
   * Returns a plain Decimal suitable for Prisma persistence.
   * The currency is stored at the tenant level (pricing_config), not per-field.
   */
  toDecimal(): Decimal {
    return this.amount;
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: cannot operate on '${this.currency}' and '${other.currency}'.`);
    }
  }
}
