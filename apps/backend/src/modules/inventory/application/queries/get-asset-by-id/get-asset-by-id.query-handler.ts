import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetAssetByIdQuery } from './get-asset-by-id.query';
import { AssetResponse } from '@repo/schemas';
import { NotFoundException } from '@nestjs/common';
import { TrackingMode } from '@repo/types';

@QueryHandler(GetAssetByIdQuery)
export class GetAssetByIdQueryHandler implements IQueryHandler<GetAssetByIdQuery, AssetResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAssetByIdQuery): Promise<AssetResponse> {
    const asset = await this.prisma.client.asset.findUnique({
      where: { id: query.id },
      include: {
        location: true,
        productType: true,
        owner: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return {
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
    };
  }
}
