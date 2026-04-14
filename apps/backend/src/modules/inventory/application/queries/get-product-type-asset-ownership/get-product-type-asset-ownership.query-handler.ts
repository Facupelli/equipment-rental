import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import {
  GetProductTypeAssetOwnershipQuery,
  ProductTypeAssetOwnershipReadModel,
} from 'src/modules/inventory/public/queries/get-product-type-asset-ownership.query';

@QueryHandler(GetProductTypeAssetOwnershipQuery)
export class GetProductTypeAssetOwnershipQueryHandler implements IQueryHandler<
  GetProductTypeAssetOwnershipQuery,
  ProductTypeAssetOwnershipReadModel[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductTypeAssetOwnershipQuery): Promise<ProductTypeAssetOwnershipReadModel[]> {
    return this.prisma.client.asset
      .findMany({
        where: {
          productTypeId: query.productTypeId,
          isActive: true,
          deletedAt: null,
          productType: {
            tenantId: query.tenantId,
          },
        },
        select: {
          id: true,
          ownerId: true,
        },
      })
      .then((assets) => assets.map((asset) => ({ assetId: asset.id, ownerId: asset.ownerId })));
  }
}
