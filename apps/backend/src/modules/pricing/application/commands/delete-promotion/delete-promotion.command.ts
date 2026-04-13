export class DeletePromotionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly promotionId: string,
  ) {}
}
