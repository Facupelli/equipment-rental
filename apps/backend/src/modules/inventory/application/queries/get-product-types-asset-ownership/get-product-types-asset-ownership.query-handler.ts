import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import {
  GetProductTypesAssetOwnershipQuery,
  ProductTypeAssetOwnershipBatchReadModel,
} from 'src/modules/inventory/public/queries/get-product-types-asset-ownership.query';

@QueryHandler(GetProductTypesAssetOwnershipQuery)
export class GetProductTypesAssetOwnershipQueryHandler implements IQueryHandler<
  GetProductTypesAssetOwnershipQuery,
  ProductTypeAssetOwnershipBatchReadModel[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductTypesAssetOwnershipQuery): Promise<ProductTypeAssetOwnershipBatchReadModel[]> {
    if (query.productTypeIds.length === 0) {
      return [];
    }

    const assets = await this.prisma.client.asset.findMany({
      where: {
        productTypeId: { in: query.productTypeIds },
        isActive: true,
        deletedAt: null,
        productType: {
          tenantId: query.tenantId,
        },
      },
      select: {
        id: true,
        ownerId: true,
        productTypeId: true,
      },
    });

    return assets.map((asset) => ({
      productTypeId: asset.productTypeId,
      assetId: asset.id,
      ownerId: asset.ownerId,
    }));
  }
}
