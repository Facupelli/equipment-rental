export type LocationContextReadModel = {
  id: string;
  supportsDelivery: boolean;
};

export class GetLocationContextQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
  ) {}
}
