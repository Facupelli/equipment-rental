import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetPromotionByIdQuery } from './get-promotion-by-id.query';
import { GetPromotionByIdResponseDto } from './get-promotion-by-id.response.dto';

@QueryHandler(GetPromotionByIdQuery)
export class GetPromotionByIdQueryHandler implements IQueryHandler<
  GetPromotionByIdQuery,
  GetPromotionByIdResponseDto | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPromotionByIdQuery): Promise<GetPromotionByIdResponseDto | null> {
    const row = await this.prisma.client.promotion.findFirst({
      where: { id: query.id, tenantId: query.tenantId },
      include: { exclusions: true },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      type: row.type as GetPromotionByIdResponseDto['type'],
      priority: row.priority,
      stackable: row.stackable,
      isActive: row.isActive,
      condition: row.condition as GetPromotionByIdResponseDto['condition'],
      effect: row.effect as GetPromotionByIdResponseDto['effect'],
      excludedProductTypeIds: row.exclusions.flatMap((exclusion) =>
        exclusion.productTypeId ? [exclusion.productTypeId] : [],
      ),
      excludedBundleIds: row.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
