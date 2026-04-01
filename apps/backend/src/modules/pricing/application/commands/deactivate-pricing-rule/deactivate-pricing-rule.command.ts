export class DeactivatePricingRuleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly pricingRuleId: string,
  ) {}
}
