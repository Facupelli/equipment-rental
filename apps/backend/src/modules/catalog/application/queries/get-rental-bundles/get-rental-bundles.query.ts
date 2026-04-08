export class GetRentalBundlesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly pickupDate: string | undefined,
    public readonly returnDate: string | undefined,
  ) {}
}
