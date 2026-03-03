import { PricingRule } from '../entities/pricing-rule.entity';

export abstract class PricingRuleRepositoryPort {
  abstract load(id: string): Promise<PricingRule | null>;
  abstract save(pricingRule: PricingRule): Promise<string>;
}
