import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { ListPromotionsQuery } from './list-promotions.query';
import { ListPromotionsResponseDto, PromotionView } from './list-promotions.response.dto';

@QueryHandler(ListPromotionsQuery)
export class ListPromotionsHandler implements IQueryHandler<ListPromotionsQuery, ListPromotionsResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPromotionsQuery): Promise<ListPromotionsResponseDto> {
    const { tenantId, page, limit, search, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(type ? { type } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.promotion.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { exclusions: true },
      }),
      this.prisma.client.promotion.count({ where }),
    ]);

    const data: PromotionView[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as PromotionView['type'],
      priority: row.priority,
      stackable: row.stackable,
      isActive: row.isActive,
      condition: row.condition as PromotionView['condition'],
      effect: row.effect as PromotionView['effect'],
      excludedProductTypeIds: row.exclusions.flatMap((exclusion) =>
        exclusion.productTypeId ? [exclusion.productTypeId] : [],
      ),
      excludedBundleIds: row.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
