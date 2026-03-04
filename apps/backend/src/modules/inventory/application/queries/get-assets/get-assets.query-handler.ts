import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetsQuery } from './get-assets.query';
import { AssetListResponse } from '@repo/schemas';

@QueryHandler(GetAssetsQuery)
export class GetAssetsQueryHandler implements IQueryHandler<GetAssetsQuery, AssetListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAssetsQuery): Promise<AssetListResponse> {
    const where: Record<string, unknown> = {};

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

    const assets = await this.prisma.client.asset.findMany({
      where,
      include: {
        location: true,
        productType: true,
        owner: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assets.map((asset) => ({
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
        trackingMode: asset.productType.trackingMode,
      },
      owner: asset.owner
        ? {
            id: asset.owner.id,
            name: asset.owner.name,
          }
        : null,
    }));
  }
}
