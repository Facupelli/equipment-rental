import Decimal from 'decimal.js';

export interface ManualPricingOverrideProps {
  finalPrice: Decimal;
  setByUserId: string | null;
  setAt: Date | null;
  previousFinalPrice: Decimal | null;
}

export class ManualPricingOverride {
  readonly finalPrice: Decimal;
  readonly setByUserId: string | null;
  readonly setAt: Date | null;
  readonly previousFinalPrice: Decimal | null;

  private constructor(props: ManualPricingOverrideProps) {
    this.finalPrice = props.finalPrice;
    this.setByUserId = props.setByUserId;
    this.setAt = props.setAt;
    this.previousFinalPrice = props.previousFinalPrice;
  }

  static create(props: ManualPricingOverrideProps): ManualPricingOverride {
    ManualPricingOverride.assertValidFinalPrice(props.finalPrice);

    return new ManualPricingOverride(props);
  }

  static fromJSON(raw: unknown): ManualPricingOverride {
    const data = raw as Record<string, unknown>;
    const finalPrice = new Decimal(data.finalPrice as string);

    ManualPricingOverride.assertValidFinalPrice(finalPrice);

    return new ManualPricingOverride({
      finalPrice,
      setByUserId: typeof data.setByUserId === 'string' ? data.setByUserId : null,
      setAt: typeof data.setAt === 'string' ? new Date(data.setAt) : null,
      previousFinalPrice: typeof data.previousFinalPrice === 'string' ? new Decimal(data.previousFinalPrice) : null,
    });
  }

  toJSON(): object {
    return {
      finalPrice: this.finalPrice.toString(),
      setByUserId: this.setByUserId,
      setAt: this.setAt?.toISOString() ?? null,
      previousFinalPrice: this.previousFinalPrice?.toString() ?? null,
    };
  }

  private static assertValidFinalPrice(finalPrice: Decimal): void {
    if (finalPrice.isNegative()) {
      throw new Error('Manual pricing override final price cannot be negative.');
    }
  }
}
