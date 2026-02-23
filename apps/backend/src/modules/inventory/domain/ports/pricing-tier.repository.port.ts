import { PricingTier } from '../entities/pricing-tier.entity';

export abstract class PricingTierRepositoryPort {
  abstract save(entity: PricingTier): Promise<string>;
}
