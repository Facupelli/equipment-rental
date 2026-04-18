import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { AssetGroupResponseDto } from '@repo/schemas';
import type { TrackingMode } from '@repo/types';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

import { GetAssetsQuery } from './get-assets.query';
import type { GetAssetsResponse } from './get-assets.response.dto';

@QueryHandler(GetAssetsQuery)
export class GetAssetsQueryHandler implements IQueryHandler<GetAssetsQuery, GetAssetsResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAssetsQuery): Promise<GetAssetsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const assetMembershipWhere: Prisma.AssetWhereInput = {
      deletedAt: null,
      location: {
        tenantId: query.tenantId,
      },
    };

    if (query.locationId) {
      assetMembershipWhere.locationId = query.locationId;
    }

    if (query.isActive !== undefined) {
      assetMembershipWhere.isActive = query.isActive;
    }

    const productTypeWhere: Prisma.ProductTypeWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      assets: {
        some: assetMembershipWhere,
      },
    };

    if (query.productTypeId) {
      productTypeWhere.id = query.productTypeId;
    }

    if (search) {
      productTypeWhere.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            {
              assets: {
                some: {
                  ...assetMembershipWhere,
                  OR: [
                    { serialNumber: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const [productTypes, total] = await Promise.all([
      this.prisma.client.productType.findMany({
        where: productTypeWhere,
        select: {
          id: true,
          name: true,
          description: true,
          trackingMode: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.client.productType.count({ where: productTypeWhere }),
    ]);

    if (productTypes.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const assets = await this.prisma.client.asset.findMany({
      where: {
        ...assetMembershipWhere,
        productTypeId: {
          in: productTypes.map((productType) => productType.id),
        },
        ...(search
          ? {
              OR: [
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { productType: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        location: true,
        productType: true,
        owner: true,
      },
      orderBy: [{ productType: { name: 'asc' } }, { serialNumber: 'asc' }, { createdAt: 'desc' }],
    });

    const assetsByProductType = new Map<string, AssetGroupResponseDto['assets']>();

    for (const asset of assets) {
      const assetGroup = assetsByProductType.get(asset.productTypeId) ?? [];
      assetGroup.push({
        id: asset.id,
        serialNumber: asset.serialNumber,
        notes: asset.notes,
        isActive: asset.isActive,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        deletedAt: asset.deletedAt,
        location: {
          id: asset.location.id,
          name: asset.location.name,
          address: asset.location.address,
        },
        productType: {
          id: asset.productType.id,
          name: asset.productType.name,
          description: asset.productType.description,
          trackingMode: asset.productType.trackingMode as TrackingMode,
        },
        owner: asset.owner
          ? {
              id: asset.owner.id,
              name: asset.owner.name,
            }
          : null,
      });
      assetsByProductType.set(asset.productTypeId, assetGroup);
    }

    return {
      data: productTypes.map((productType) => {
        const groupedAssets = assetsByProductType.get(productType.id) ?? [];

        return {
          productType: {
            id: productType.id,
            name: productType.name,
            description: productType.description,
            trackingMode: productType.trackingMode as TrackingMode,
          },
          assetCount: groupedAssets.length,
          assets: groupedAssets,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
