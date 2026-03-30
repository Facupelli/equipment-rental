export class GetRentalBundlesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}
