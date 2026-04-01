export class ActivatePricingRuleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly pricingRuleId: string,
  ) {}
}
