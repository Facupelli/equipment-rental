export class GetLocationSchedulesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
  ) {}
}
