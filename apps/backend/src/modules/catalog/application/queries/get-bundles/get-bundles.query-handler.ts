import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBundlesQuery } from './get-bundles.query';
import { PrismaService } from 'src/core/database/prisma.service';

type BundleListItemReadModel = {
  id: string;
  name: string;
  imageUrl: string;
  billingUnitId: string;
  billingUnit: { label: string };
  basePrice: number | null;
  componentCount: number;
  createdAt: Date;
  publishedAt: Date | null;
  retiredAt: Date | null;
};

type PaginatedReadModel<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@QueryHandler(GetBundlesQuery)
export class GetBundlesQueryHandler implements IQueryHandler<
  GetBundlesQuery,
  PaginatedReadModel<BundleListItemReadModel>
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBundlesQuery): Promise<PaginatedReadModel<BundleListItemReadModel>> {
    const { tenantId, page, limit, name } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
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
          imageUrl: true,
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
        imageUrl: row.imageUrl ?? '',
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
