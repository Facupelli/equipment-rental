export class GetProductTypesAssetOwnershipQuery {
  constructor(
    public readonly tenantId: string,
    public readonly productTypeIds: string[],
  ) {}
}

export type ProductTypeAssetOwnershipBatchReadModel = {
  productTypeId: string;
  assetId: string;
  ownerId: string | null;
};
