import { PricingRuleType } from '@repo/types';

export class ListPricingRulesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly type?: PricingRuleType,
  ) {}
}
