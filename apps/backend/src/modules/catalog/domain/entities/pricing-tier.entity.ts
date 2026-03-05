import { randomUUID } from 'crypto';
import {
  InvalidPricingTierRangeException,
  InvalidPricingTierPriceException,
} from '../exceptions/pricing-tier.exceptions';
import Decimal from 'decimal.js';

export interface CreatePricingTierProps {
  productTypeId: string | null;
  bundleId: string | null;
  locationId: string | null;
  fromUnit: number;
  toUnit: number | null;
  pricePerUnit: number;
}

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
      props.productTypeId,
      props.bundleId,
      props.locationId ?? null,
      props.fromUnit,
      props.toUnit ?? null,
      price,
    );
  }

  static reconstitute(props: ReconstitutePricingTierProps): PricingTier {
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
}
