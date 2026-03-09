import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetRentalProductTypesQuery } from './get-rental-product-types.query';
import { PaginatedDto, RentalProductResponse } from '@repo/schemas';
import { Prisma } from 'src/generated/prisma/client';
import { IncludedItem } from 'src/modules/catalog/domain/entities/product-type.entity';

@QueryHandler(GetRentalProductTypesQuery)
export class GetRentalProductTypesQueryHandler implements IQueryHandler<
  GetRentalProductTypesQuery,
  PaginatedDto<RentalProductResponse>
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRentalProductTypesQuery): Promise<PaginatedDto<RentalProductResponse>> {
    const { locationId, categoryId, search } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where = this.buildWhere({ locationId, categoryId, search });

    const [rawProducts, total] = await Promise.all([
      this.prisma.client.productType.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          includedItems: true,
          attributes: true,

          // Count only assets at the requested location that are active.
          _count: {
            select: {
              assets: {
                where: {
                  locationId,
                  isActive: true,
                  deletedAt: null,
                },
              },
            },
          },

          category: {
            select: { id: true, name: true },
          },

          billingUnit: {
            select: { id: true, label: true },
          },

          // Only tiers for this specific location — no global fallback.
          pricingTiers: {
            where: {
              OR: [{ locationId }, { locationId: null }],
            },
            select: {
              id: true,
              locationId: true,
              fromUnit: true,
              toUnit: true,
              pricePerUnit: true,
            },
            orderBy: { fromUnit: 'asc' },
          },
        },
      }),

      this.prisma.client.productType.count({ where }),
    ]);

    const items: RentalProductResponse[] = rawProducts.map((product) => {
      const locationTiers = product.pricingTiers.filter((t) => t.locationId === locationId);
      const resolvedTiers =
        locationTiers.length > 0 ? locationTiers : product.pricingTiers.filter((t) => t.locationId === null);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        availableCount: product._count.assets,
        category: product.category ?? null,
        attributes: product.attributes as Record<string, string>,
        includedItems: product.includedItems as unknown as IncludedItem[],
        billingUnit: product.billingUnit,
        pricingTiers: resolvedTiers.map((tier) => ({
          id: tier.id,
          fromUnit: tier.fromUnit,
          toUnit: tier.toUnit,
          // Prisma returns Decimal for Decimal fields — convert to JS number.
          pricePerUnit: tier.pricePerUnit.toNumber(),
        })),
      };
    });

    return {
      data: items,
      meta: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildWhere({
    locationId,
    categoryId,
    search,
  }: Pick<GetRentalProductTypesQuery, 'locationId' | 'categoryId' | 'search'>): Prisma.ProductTypeWhereInput {
    return {
      retiredAt: null,
      publishedAt: { not: null },
      deletedAt: null,

      // Category filter — omitted entirely when not provided so Prisma doesn't
      // add an unnecessary WHERE clause.
      ...(categoryId ? { categoryId } : {}),

      // Case-insensitive name search.
      ...(search ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } } : {}),

      // Only products that have at least one active asset at this location.
      assets: {
        some: {
          locationId,
          isActive: true,
          deletedAt: null,
        },
      },

      // Only products that have at least one pricing tier — either location-specific
      // or global. Products with no tiers at all are excluded.
      pricingTiers: {
        some: {
          OR: [{ locationId }, { locationId: null }],
        },
      },
    };
  }
}
