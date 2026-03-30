import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { Prisma } from 'src/generated/prisma/client';
import { FindAvailableParams } from '../../inventory.contracts';

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
  async findAvailableAssetIds(params: FindAvailableParams): Promise<string[]> {
    const quantity = params.quantity ?? 1;
    const tstzrange = formatPostgresRange(params.period);

    const assetFilter = params.assetId && quantity === 1 ? Prisma.sql`AND a.id = ${params.assetId}` : Prisma.empty;

    const excludeFilter =
      params.excludeAssetIds && params.excludeAssetIds.length > 0
        ? Prisma.sql`AND a.id != ALL(${params.excludeAssetIds})`
        : Prisma.empty;

    const rows = await this.prisma.client.$queryRaw<{ id: string }[]>`
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

  // Keep the single-asset convenience method as a thin wrapper so existing
  // callers (bundle component reservation, etc.) remain unchanged.
  async findAvailableAssetId(params: FindAvailableParams): Promise<string | null> {
    const ids = await this.findAvailableAssetIds({ ...params, quantity: 1 });
    return ids[0] ?? null;
  }
}
