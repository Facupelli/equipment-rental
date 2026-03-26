export class GetAssetsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId?: string,
    public readonly productTypeId?: string,
    public readonly isActive?: boolean,
    public readonly search?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
