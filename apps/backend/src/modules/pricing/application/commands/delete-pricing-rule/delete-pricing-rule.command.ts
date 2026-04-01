export class DeletePricingRuleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly pricingRuleId: string,
  ) {}
}
