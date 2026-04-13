export class ActivatePromotionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly promotionId: string,
  ) {}
}
