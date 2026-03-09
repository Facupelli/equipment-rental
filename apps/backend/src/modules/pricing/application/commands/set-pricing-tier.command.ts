import { PricingTargetType } from '../../domain/entities/pricing-tier.entity';

export interface SetPricingTierItem {
  locationId: string | null;
  fromUnit: number;
  toUnit: number | null;
  pricePerUnit: string;
}

export class SetPricingTiersCommand {
  constructor(
    public readonly targetType: PricingTargetType,
    public readonly targetId: string,
    public readonly tiers: SetPricingTierItem[],
  ) {}
}
