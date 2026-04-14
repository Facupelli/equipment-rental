export type ExternalAssetOwnershipReadModel = {
  assetId: string;
  ownerId: string;
};

export class FindAssetsWithoutActiveOwnerContractsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly date: Date,
    public readonly assets: ExternalAssetOwnershipReadModel[],
  ) {}
}
