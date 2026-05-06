import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { Prisma } from 'src/generated/prisma/client';
import { FindAvailableParams, GetAvailableAssetCountsParams } from '../../inventory.contracts';

@Injectable()
export class AssetAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds `quantity` distinct available asset IDs for the given product type,
   * location, and period. Returns fewer than `quantity` IDs (including an empty
   * array) if not enough assets are available — callers must check the length.
   *
   * Requesting multiple IDs in a single query guarantees each returned ID is
   * distinct, eliminating the within-request duplicate-asset bug that would
   * arise from calling findAvailableAssetId N times before any assignment is
   * written.
   *
   * `excludeAssetIds` allows the caller to exclude assets already claimed
   * earlier in the same allocation pass (e.g. pinned assets resolved first
   * within the same productTypeId group).
   *
   * The NOT EXISTS subquery checks all assignment types. For ORDER
   * assignments, both HOLD and COMMITTED stages remain blocking while the row
   * exists, so any overlapping assignment blocks availability.
   *
   * Filtering by locationId provides implicit tenant isolation:
   * a location belongs to exactly one tenant, making cross-tenant
   * asset access structurally impossible.
   */
  async findAvailableAssetIds(params: FindAvailableParams, tx?: PrismaTransactionClient): Promise<string[]> {
    const quantity = params.quantity ?? 1;
    const tstzrange = formatPostgresRange(params.period);
    const db = tx ?? this.prisma.client;

    const assetFilter = params.assetId && quantity === 1 ? Prisma.sql`AND a.id = ${params.assetId}` : Prisma.empty;

    const excludeFilter =
      params.excludeAssetIds && params.excludeAssetIds.length > 0
        ? Prisma.sql`AND a.id != ALL(${params.excludeAssetIds})`
        : Prisma.empty;

    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT a.id
      FROM assets a
      WHERE a.product_type_id = ${params.productTypeId}
        AND a.location_id     = ${params.locationId}
        AND a.is_active       = true
        AND a.deleted_at      IS NULL
        ${assetFilter}
        ${excludeFilter}
        AND NOT EXISTS (
          SELECT 1
          FROM asset_assignments aa
          WHERE aa.asset_id = a.id
            AND aa.period && ${tstzrange}::tstzrange
        )
      LIMIT ${quantity}
    `;

    return rows.map((r) => r.id);
  }

  async getAvailableAssetCountsByProductType(params: GetAvailableAssetCountsParams): Promise<Map<string, number>> {
    if (params.productTypeIds.length === 0) {
      return new Map();
    }

    const tstzrange = formatPostgresRange(params.period);

    const rows = await this.prisma.client.$queryRaw<{ productTypeId: string; availableCount: bigint }[]>`
      SELECT a.product_type_id AS "productTypeId", COUNT(*)::bigint AS "availableCount"
      FROM assets a
      WHERE a.product_type_id IN (${Prisma.join(params.productTypeIds)})
        AND a.location_id     = ${params.locationId}
        AND a.is_active       = true
        AND a.deleted_at      IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM asset_assignments aa
          WHERE aa.asset_id = a.id
            AND aa.period && ${tstzrange}::tstzrange
        )
      GROUP BY a.product_type_id
    `;

    return new Map(rows.map((row) => [row.productTypeId, Number(row.availableCount)]));
  }

  // Keep the single-asset convenience method as a thin wrapper so existing
  // callers (bundle component reservation, etc.) remain unchanged.
  async findAvailableAssetId(params: FindAvailableParams, tx?: PrismaTransactionClient): Promise<string | null> {
    const ids = await this.findAvailableAssetIds({ ...params, quantity: 1 }, tx);
    return ids[0] ?? null;
  }
}
