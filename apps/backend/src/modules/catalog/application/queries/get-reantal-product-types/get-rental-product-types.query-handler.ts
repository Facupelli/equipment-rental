import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetRentalProductTypesQuery } from './get-rental-product-types.query';
import { PaginatedDto, RentalProductResponse } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';
import { Prisma } from 'src/generated/prisma/client';
import { IncludedItem } from 'src/modules/catalog/domain/entities/product-type.entity';

interface ProductCatalogRow {
  id: string;
  name: string;
  description: string | null;
  attributes: Prisma.JsonValue;
  included_items: Prisma.JsonValue;
  available_count: bigint; // Postgres COUNT returns bigint
  category_id: string | null;
  category_name: string | null;
}

interface CountRow {
  total: bigint;
}

@QueryHandler(GetRentalProductTypesQuery)
export class GetRentalProductTypesQueryHandler implements IQueryHandler<
  GetRentalProductTypesQuery,
  PaginatedDto<RentalProductResponse>
> {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: GetRentalProductTypesQuery): Promise<PaginatedDto<RentalProductResponse>> {
    const { locationId, categoryId, search } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    console.log({ query });

    const tenantId = this.tenantContext.requireTenantId();

    // Build optional filter fragments.
    // Prisma.sql is a tagged template that safely parameterises values.
    // Prisma.empty is a no-op fragment used as a fallback.
    const categoryFilter = categoryId ? Prisma.sql`AND pt.category_id = ${categoryId}` : Prisma.empty;

    const searchFilter = search ? Prisma.sql`AND pt.name ILIKE ${'%' + search + '%'}` : Prisma.empty;

    const [rows, countRows] = await Promise.all([
      this.prisma.client.$queryRaw<ProductCatalogRow[]>`
        SELECT
          pt.id,
          pt.name,
          pt.description,
          pt.attributes,
          pt.included_items,
          COUNT(a.id)::int        AS available_count,
          pc.id                   AS category_id,
          pc.name                 AS category_name
        FROM product_types pt
        LEFT JOIN product_categories pc
          ON pc.id = pt.category_id
        INNER JOIN assets a
          ON  a.product_type_id = pt.id
          AND a.location_id     = ${locationId}
          AND a.is_active       = true
          AND a.deleted_at      IS NULL
        WHERE pt.tenant_id  = ${tenantId}
          AND pt.is_active  = true
          AND pt.deleted_at IS NULL
          ${categoryFilter}
          ${searchFilter}
        GROUP BY pt.id, pc.id
        HAVING COUNT(a.id) >= 1
        ORDER BY pt.name ASC
        LIMIT  ${limit}
        OFFSET ${offset}
      `,

      this.prisma.client.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS total
        FROM (
          SELECT pt.id
          FROM product_types pt
          INNER JOIN assets a
            ON  a.product_type_id = pt.id
            AND a.location_id     = ${locationId}
            AND a.is_active       = true
            AND a.deleted_at      IS NULL
          WHERE pt.tenant_id  = ${tenantId}
            AND pt.is_active  = true
            AND pt.deleted_at IS NULL
            ${categoryFilter}
            ${searchFilter}
          GROUP BY pt.id
          HAVING COUNT(a.id) >= 1
        ) sub
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);

    console.log({ rows });

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        attributes: row.attributes as Record<string, string>,
        includedItems: row.included_items as unknown as IncludedItem[],
        availableCount: Number(row.available_count), // bigint → number
        category: row.category_id && row.category_name ? { id: row.category_id, name: row.category_name } : null,
      })),
      meta: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
