export class GetProductTypeAssetOwnershipQuery {
  constructor(
    public readonly tenantId: string,
    public readonly productTypeId: string,
  ) {}
}

export type ProductTypeAssetOwnershipReadModel = {
  assetId: string;
  ownerId: string | null;
};
