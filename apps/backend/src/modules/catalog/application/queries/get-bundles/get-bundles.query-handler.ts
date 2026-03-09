import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBundlesQuery } from './get-bundles.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { BundleListItemResponseDto, PaginatedDto } from '@repo/schemas';

@QueryHandler(GetBundlesQuery)
export class GetBundlesQueryHandler implements IQueryHandler<GetBundlesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBundlesQuery): Promise<PaginatedDto<BundleListItemResponseDto>> {
    const { page, limit, name } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(name && {
        name: { contains: name, mode: 'insensitive' as const },
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.bundle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          billingUnitId: true,
          createdAt: true,
          publishedAt: true,
          retiredAt: true,
          // Resolve the label — no extra query, Prisma joins it
          billingUnit: {
            select: { label: true },
          },
          // Take only the base tier (lowest fromUnit = smallest unit = base price)
          pricingTiers: {
            where: { locationId: null }, // global tiers only, not location-specific
            orderBy: { fromUnit: 'asc' },
            take: 1,
            select: { pricePerUnit: true },
          },
          _count: { select: { components: true } },
        },
      }),
      this.prisma.client.bundle.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        billingUnitId: row.billingUnitId,
        billingUnit: { label: row.billingUnit.label },
        // Prisma returns Decimal — coerce to JS number for the DTO
        basePrice: row.pricingTiers[0] ? Number(row.pricingTiers[0].pricePerUnit) : null,
        componentCount: row._count.components,
        createdAt: row.createdAt,
        publishedAt: row.publishedAt,
        retiredAt: row.retiredAt,
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
