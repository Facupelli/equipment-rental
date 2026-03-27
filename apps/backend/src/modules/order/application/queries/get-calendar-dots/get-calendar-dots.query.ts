export class GetCalendarDotsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly from: string,
    public readonly to: string,
  ) {}
}
