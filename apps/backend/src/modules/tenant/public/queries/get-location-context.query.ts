export type LocationContextReadModel = {
  id: string;
  supportsDelivery: boolean;
  effectiveTimezone: string;
  locationTimezone: string | null;
  tenantTimezone: string;
  timezoneSource: 'LOCATION' | 'TENANT';
};

export class GetLocationContextQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
  ) {}
}
