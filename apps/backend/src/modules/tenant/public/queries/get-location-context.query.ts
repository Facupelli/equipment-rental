export type LocationContextReadModel = {
  id: string;
};

export class GetLocationContextQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
  ) {}
}
