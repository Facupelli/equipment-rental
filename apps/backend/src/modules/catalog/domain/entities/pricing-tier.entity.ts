import { randomUUID } from 'crypto';
import {
  InvalidPricingTierRangeException,
  InvalidPricingTierPriceException,
} from '../exceptions/pricing-tier.exceptions';
import Decimal from 'decimal.js';

export interface CreatePricingTierProps {
  productTypeId?: string;
  bundleId?: string;
  locationId?: string;
  fromUnit: number;
  toUnit?: number;
  pricePerUnit: Decimal;
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
    if (props.fromUnit <= 0) {
      throw new InvalidPricingTierRangeException('fromUnit must be greater than zero.');
    }
    if (props.toUnit !== undefined && props.toUnit <= props.fromUnit) {
      throw new InvalidPricingTierRangeException('toUnit must be greater than fromUnit.');
    }
    if (props.pricePerUnit.lessThanOrEqualTo(0)) {
      throw new InvalidPricingTierPriceException();
    }
    return new PricingTier(
      randomUUID(),
      props.productTypeId ?? null,
      props.bundleId ?? null,
      props.locationId ?? null,
      props.fromUnit,
      props.toUnit ?? null,
      props.pricePerUnit,
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
