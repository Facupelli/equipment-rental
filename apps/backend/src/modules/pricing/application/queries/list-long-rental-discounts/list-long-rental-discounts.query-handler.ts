import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { ListLongRentalDiscountsQuery } from './list-long-rental-discounts.query';
import { ListLongRentalDiscountsResponseDto, LongRentalDiscountView } from './list-long-rental-discounts.response.dto';

@QueryHandler(ListLongRentalDiscountsQuery)
export class ListLongRentalDiscountsHandler implements IQueryHandler<
  ListLongRentalDiscountsQuery,
  ListLongRentalDiscountsResponseDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListLongRentalDiscountsQuery): Promise<ListLongRentalDiscountsResponseDto> {
    const { tenantId, page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.longRentalDiscount.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { exclusions: true },
      }),
      this.prisma.client.longRentalDiscount.count({ where }),
    ]);

    const data: LongRentalDiscountView[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      priority: row.priority,
      isActive: row.isActive,
      tiers: row.tiers as LongRentalDiscountView['tiers'],
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
