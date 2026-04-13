export class DeactivatePromotionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly promotionId: string,
  ) {}
}
