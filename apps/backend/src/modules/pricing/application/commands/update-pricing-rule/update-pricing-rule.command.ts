import { PricingRuleCondition, PricingRuleEffect } from '../../../domain/types/pricing-rule.types';
import { PricingRuleScope, PricingRuleType } from '../../../domain/entities/pricing-rule.entity';

export class UpdatePricingRuleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly pricingRuleId: string,
    public readonly name: string,
    public readonly type: PricingRuleType,
    public readonly scope: PricingRuleScope,
    public readonly priority: number,
    public readonly stackable: boolean,
    public readonly condition: PricingRuleCondition,
    public readonly effect: PricingRuleEffect,
  ) {}
}
