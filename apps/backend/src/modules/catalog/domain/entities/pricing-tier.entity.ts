import { randomUUID } from 'crypto';
import {
  InvalidPricingTierRangeException,
  InvalidPricingTierPriceException,
  InvalidPricingTierParentException,
} from '../exceptions/pricing-tier.exceptions';
import Decimal from 'decimal.js';

type PricingTierParent = { bundleId: string; productTypeId?: never } | { productTypeId: string; bundleId?: never };

export type CreatePricingTierProps = PricingTierParent & {
  locationId: string | null;
  fromUnit: number;
  toUnit: number | null;
  pricePerUnit: string;
};

export interface ReconstitutePricingTierProps {
  id: string;
  productTypeId: string | null;
  bundleId: string | null;
  locationId: string | null;
  fromUnit: number;
  toUnit: number | null;
  pricePerUnit: Decimal;
}

export class PricingTier {
  private constructor(
    public readonly id: string,
    public readonly productTypeId: string | null,
    public readonly bundleId: string | null,
    public readonly locationId: string | null,
    public readonly fromUnit: number,
    public readonly toUnit: number | null,
    public readonly pricePerUnit: Decimal,
  ) {}

  static create(props: CreatePricingTierProps): PricingTier {
    const price = new Decimal(props.pricePerUnit);

    if (props.fromUnit <= 0) {
      throw new InvalidPricingTierRangeException('fromUnit must be greater than zero.');
    }
    if (props.toUnit !== null && props.toUnit <= props.fromUnit) {
      throw new InvalidPricingTierRangeException('toUnit must be greater than fromUnit.');
    }
    if (price.lessThanOrEqualTo(0)) {
      throw new InvalidPricingTierPriceException();
    }

    return new PricingTier(
      randomUUID(),
      props.productTypeId ?? null,
      props.bundleId ?? null,
      props.locationId,
      props.fromUnit,
      props.toUnit,
      price,
    );
  }

  static reconstitute(props: ReconstitutePricingTierProps): PricingTier {
    const hasBundle = props.bundleId != null;
    const hasProductType = props.productTypeId != null;

    if (hasBundle === hasProductType) {
      throw new InvalidPricingTierParentException();
    }

    return new PricingTier(
      props.id,
      props.productTypeId,
      props.bundleId,
      props.locationId,
      props.fromUnit,
      props.toUnit,
      props.pricePerUnit,
    );
  }

  /**
   * Returns true if this tier covers the given unit count.
   * toUnit being null means the tier is open-ended (no upper bound).
   */
  coversUnits(units: number): boolean {
    const withinLower = units >= this.fromUnit;
    const withinUpper = this.toUnit === null || units <= this.toUnit;
    return withinLower && withinUpper;
  }
}
