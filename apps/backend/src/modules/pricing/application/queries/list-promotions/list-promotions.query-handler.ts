import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { ListPromotionsQuery } from './list-promotions.query';
import { ListPromotionsResponseDto, PromotionView } from './list-promotions.response.dto';

@QueryHandler(ListPromotionsQuery)
export class ListPromotionsHandler implements IQueryHandler<ListPromotionsQuery, ListPromotionsResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPromotionsQuery): Promise<ListPromotionsResponseDto> {
    const { tenantId, page, limit, search, activationType } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(activationType ? { type: activationType === 'COUPON' ? ('COUPON' as const) : ('SEASONAL' as const) } : {}),
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
      activationType: (row.type === 'COUPON' ? 'COUPON' : 'AUTOMATIC') as PromotionView['activationType'],
      priority: row.priority,
      stackingType: (row.stackable ? 'COMBINABLE' : 'EXCLUSIVE') as PromotionView['stackingType'],
      validFrom: ((row.condition as { validFrom?: string | null }).validFrom
        ? new Date((row.condition as { validFrom?: string | null }).validFrom!)
        : null) as PromotionView['validFrom'],
      validUntil: ((row.condition as { validUntil?: string | null }).validUntil
        ? new Date((row.condition as { validUntil?: string | null }).validUntil!)
        : null) as PromotionView['validUntil'],
      isActive: row.isActive,
      conditions: ((row.condition as { conditions?: PromotionView['conditions'] }).conditions ??
        []) as PromotionView['conditions'],
      applicability: {
        appliesTo: ((row.condition as { appliesTo?: PromotionView['applicability']['appliesTo'] }).appliesTo ?? [
          'PRODUCT',
          'BUNDLE',
        ]) as PromotionView['applicability']['appliesTo'],
        excludedProductTypeIds: row.exclusions.flatMap((exclusion) =>
          exclusion.productTypeId ? [exclusion.productTypeId] : [],
        ),
        excludedBundleIds: row.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      },
      effect: row.effect as PromotionView['effect'],
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
