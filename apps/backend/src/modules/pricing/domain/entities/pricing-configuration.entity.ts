import { DuplicatePricingTierException } from '../exceptions/pricing-tier.exceptions';
import { PricingTargetType, PricingTier } from './pricing-tier.entity';

export interface CreatePricingConfigurationProps {
  targetType: PricingTargetType;
  targetId: string;
}

export interface ReconstitutePricingConfigurationProps {
  targetType: PricingTargetType;
  targetId: string;
  tiers: PricingTier[];
}

export class PricingConfiguration {
  private constructor(
    public readonly targetType: PricingTargetType,
    public readonly targetId: string,
    private tiers: PricingTier[],
  ) {}

  static create(props: CreatePricingConfigurationProps): PricingConfiguration {
    return new PricingConfiguration(props.targetType, props.targetId, []);
  }

  static reconstitute(props: ReconstitutePricingConfigurationProps): PricingConfiguration {
    return new PricingConfiguration(props.targetType, props.targetId, props.tiers);
  }

  getTiers(): PricingTier[] {
    return [...this.tiers];
  }

  // Replaces the entire tier collection atomically.
  // Validates for duplicates within the incoming set before replacing.
  setTiers(incoming: PricingTier[]): void {
    const seen = new Set<string>();

    for (const tier of incoming) {
      // The uniqueness key mirrors the DB unique constraints:
      // (targetId, locationId, fromUnit) per target type
      const key = `${tier.locationId ?? 'global'}:${tier.fromUnit}`;
      if (seen.has(key)) {
        throw new DuplicatePricingTierException(tier.fromUnit, tier.locationId);
      }
      seen.add(key);
    }

    this.tiers = incoming;
  }
}
