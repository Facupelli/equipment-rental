export class GetPendingReviewOrdersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly locationId?: string,
  ) {}
}
