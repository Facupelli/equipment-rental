export class GetProductTimelineQuery {
  constructor(
    public readonly tenantId: string,
    public readonly productTypeId: string,
    public readonly locationId: string,
    public readonly from: string,
    public readonly to: string,
  ) {}
}
