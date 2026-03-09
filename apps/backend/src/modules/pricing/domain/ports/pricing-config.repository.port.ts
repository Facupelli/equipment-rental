import { PricingConfiguration } from '../entities/pricing-configuration.entity';
import { PricingTargetType } from '../entities/pricing-tier.entity';

export abstract class PricingConfigurationRepositoryPort {
  abstract load(targetType: PricingTargetType, targetId: string): Promise<PricingConfiguration | null>;
  abstract save(configuration: PricingConfiguration): Promise<void>;
}
