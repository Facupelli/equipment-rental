import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AssetDto, FindAssetByIdQuery } from './find-asset-by-id.query';
import { PrismaService } from 'src/core/database/prisma.service';

@QueryHandler(FindAssetByIdQuery)
export class FindAssetByIdQueryHandler implements IQueryHandler<FindAssetByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindAssetByIdQuery): Promise<AssetDto | null> {
    const asset = await this.prisma.client.asset.findFirst({
      where: {
        id: query.id,
        location: {
          tenantId: query.tenantId,
        },
      },
      select: { id: true, ownerId: true },
    });

    return asset ?? null;
  }
}
