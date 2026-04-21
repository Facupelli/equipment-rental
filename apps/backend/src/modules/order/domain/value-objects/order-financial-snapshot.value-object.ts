import Decimal from 'decimal.js';

export interface OrderFinancialSnapshotProps {
  readonly currency: string;
  readonly subtotalBeforeDiscounts: Decimal;
  readonly itemsDiscountTotal: Decimal;
  readonly itemsSubtotal: Decimal;
  readonly insuranceApplied: boolean;
  readonly insuranceRatePercent: number;
  readonly insuranceAmount: Decimal;
  readonly total: Decimal;
}

export class OrderFinancialSnapshot {
  readonly currency: string;
  readonly subtotalBeforeDiscounts: Decimal;
  readonly itemsDiscountTotal: Decimal;
  readonly itemsSubtotal: Decimal;
  readonly insuranceApplied: boolean;
  readonly insuranceRatePercent: number;
  readonly insuranceAmount: Decimal;
  readonly total: Decimal;

  private constructor(props: OrderFinancialSnapshotProps) {
    this.currency = props.currency;
    this.subtotalBeforeDiscounts = props.subtotalBeforeDiscounts;
    this.itemsDiscountTotal = props.itemsDiscountTotal;
    this.itemsSubtotal = props.itemsSubtotal;
    this.insuranceApplied = props.insuranceApplied;
    this.insuranceRatePercent = props.insuranceRatePercent;
    this.insuranceAmount = props.insuranceAmount;
    this.total = props.total;
  }

  static create(props: OrderFinancialSnapshotProps): OrderFinancialSnapshot {
    return new OrderFinancialSnapshot(props);
  }

  static zero(currency: string, insuranceApplied: boolean, insuranceRatePercent: number): OrderFinancialSnapshot {
    const zero = new Decimal(0);

    return new OrderFinancialSnapshot({
      currency,
      subtotalBeforeDiscounts: zero,
      itemsDiscountTotal: zero,
      itemsSubtotal: zero,
      insuranceApplied,
      insuranceRatePercent,
      insuranceAmount: zero,
      total: zero,
    });
  }

  toJSON(): object {
    return {
      currency: this.currency,
      subtotalBeforeDiscounts: this.subtotalBeforeDiscounts.toString(),
      itemsDiscountTotal: this.itemsDiscountTotal.toString(),
      itemsSubtotal: this.itemsSubtotal.toString(),
      insuranceApplied: this.insuranceApplied,
      insuranceRatePercent: this.insuranceRatePercent,
      insuranceAmount: this.insuranceAmount.toString(),
      total: this.total.toString(),
    };
  }

  static fromJSON(raw: unknown): OrderFinancialSnapshot {
    const data = raw as Record<string, unknown>;
    const subtotalBeforeDiscounts = new Decimal(data.subtotalBeforeDiscounts as string);
    const insuranceAmount = new Decimal(data.insuranceAmount as string);
    const insuranceRatePercent =
      typeof data.insuranceRatePercent === 'number'
        ? data.insuranceRatePercent
        : OrderFinancialSnapshot.deriveLegacyInsuranceRatePercent(
            subtotalBeforeDiscounts,
            insuranceAmount,
            data.insuranceApplied as boolean,
          );

    return new OrderFinancialSnapshot({
      currency: data.currency as string,
      subtotalBeforeDiscounts,
      itemsDiscountTotal: new Decimal(data.itemsDiscountTotal as string),
      itemsSubtotal: new Decimal(data.itemsSubtotal as string),
      insuranceApplied: data.insuranceApplied as boolean,
      insuranceRatePercent,
      insuranceAmount,
      total: new Decimal(data.total as string),
    });
  }

  private static deriveLegacyInsuranceRatePercent(
    subtotalBeforeDiscounts: Decimal,
    insuranceAmount: Decimal,
    insuranceApplied: boolean,
  ): number {
    if (!insuranceApplied || subtotalBeforeDiscounts.isZero()) {
      return 0;
    }

    return insuranceAmount.div(subtotalBeforeDiscounts).mul(100).toNumber();
  }
}
