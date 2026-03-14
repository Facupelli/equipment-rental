export class GetNewArrivalsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId?: string,
  ) {}
}
