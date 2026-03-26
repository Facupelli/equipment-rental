import { Prisma } from 'src/generated/prisma/client';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TrackingMode } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetAssetsQuery } from './get-assets.query';
import { GetAssetsResponse } from './get-assets.response.dto';

@QueryHandler(GetAssetsQuery)
export class GetAssetsQueryHandler implements IQueryHandler<GetAssetsQuery, GetAssetsResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAssetsQuery): Promise<GetAssetsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      location: {
        tenantId: query.tenantId,
      },
    };

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.productTypeId) {
      where.productTypeId = query.productTypeId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      this.prisma.client.asset.findMany({
        where,
        include: {
          location: true,
          productType: true,
          owner: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.client.asset.count({ where }),
    ]);

    return {
      data: assets.map((asset) => ({
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
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
