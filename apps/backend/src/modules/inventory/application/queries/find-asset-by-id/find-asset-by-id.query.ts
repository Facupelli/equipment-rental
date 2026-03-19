export class FindAssetByIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {}
}

export interface AssetDto {
  id: string;
  ownerId: string | null;
}
