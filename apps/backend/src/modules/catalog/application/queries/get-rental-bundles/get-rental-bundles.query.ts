export class GetRentalBundlesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId?: string,
  ) {}
}
