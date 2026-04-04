export class GetRentalBundlesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly startDate: Date | undefined,
    public readonly endDate: Date | undefined,
  ) {}
}
