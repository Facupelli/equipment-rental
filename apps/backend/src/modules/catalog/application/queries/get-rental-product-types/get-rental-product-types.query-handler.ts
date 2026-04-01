import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetRentalProductTypesQuery } from './get-rental-product-types.query';
import { Prisma } from 'src/generated/prisma/client';
import {
  AvailableAssetCountReadModel,
  GetAvailableAssetCountsQuery,
} from 'src/modules/inventory/public/queries/get-available-asset-counts.query';

type RentalIncludedItemReadModel = {
  name: string;
  quantity: number;
  notes: string | null;
};

type RentalProductReadModel = {
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  availableCount: number | null; // null when no period is selected
  category: { id: string; name: string } | null;
  attributes: Record<string, string>;
  includedItems: RentalIncludedItemReadModel[];
  billingUnit: { id: string; label: string };
  pricingTiers: Array<{
    id: string;
    fromUnit: number;
    toUnit: number | null;
    pricePerUnit: number;
  }>;
};

type PaginatedReadModel<T> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
};

@QueryHandler(GetRentalProductTypesQuery)
export class GetRentalProductTypesQueryHandler implements IQueryHandler<
  GetRentalProductTypesQuery,
  PaginatedReadModel<RentalProductReadModel>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetRentalProductTypesQuery): Promise<PaginatedReadModel<RentalProductReadModel>> {
    const { tenantId, locationId, startDate, endDate, categoryId, search } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where = this.buildWhere({ tenantId, locationId, categoryId, search });

    const [rawProducts, total] = await Promise.all([
      this.prisma.client.productType.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          description: true,
          includedItems: true,
          attributes: true,

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

    const availableCounts = await this.resolveAvailability(
      locationId,
      startDate,
      endDate,
      rawProducts.map((p) => p.id),
    );

    const items: RentalProductReadModel[] = rawProducts.map((product) => {
      const locationTiers = product.pricingTiers.filter((t) => t.locationId === locationId);
      const resolvedTiers =
        locationTiers.length > 0 ? locationTiers : product.pricingTiers.filter((t) => t.locationId === null);

      return {
        id: product.id,
        name: product.name,
        // todo fix when image migration is not null
        imageUrl: product.imageUrl ?? '',
        description: product.description,
        availableCount: availableCounts?.get(product.id) ?? null,
        category: product.category ?? null,
        attributes: product.attributes as Record<string, string>,
        includedItems: product.includedItems as RentalIncludedItemReadModel[],
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
    tenantId,
    locationId,
    categoryId,
    search,
  }: Pick<
    GetRentalProductTypesQuery,
    'tenantId' | 'locationId' | 'categoryId' | 'search'
  >): Prisma.ProductTypeWhereInput {
    return {
      tenantId,
      retiredAt: null,
      publishedAt: { not: null },

      // Category filter — omitted entirely when not provided so Prisma doesn't
      // add an unnecessary WHERE clause.
      ...(categoryId ? { categoryId } : {}),

      // Case-insensitive name search.
      ...(search ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } } : {}),

      // Only products that have at least one active asset at the requested location. Availability
      // is resolved separately so blocked inventory can still yield 0.
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

  private async resolveAvailability(
    locationId: string,
    startDate: Date | undefined,
    endDate: Date | undefined,
    productTypeIds: string[],
  ): Promise<Map<string, number> | null> {
    if (!startDate || !endDate) return null;

    const rows = await this.queryBus.execute<GetAvailableAssetCountsQuery, AvailableAssetCountReadModel[]>(
      new GetAvailableAssetCountsQuery(locationId, startDate, endDate, productTypeIds),
    );

    return new Map(rows.map((row) => [row.productTypeId, row.availableCount]));
  }
}
