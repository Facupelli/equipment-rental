export class GetDraftOrderPricingProposalQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly targetTotal: string,
  ) {}
}
