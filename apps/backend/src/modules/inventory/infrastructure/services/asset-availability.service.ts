import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { Prisma } from 'src/generated/prisma/client';
import { DateRange } from '../../domain/value-objects/date-range.vo';

export type FindAvailableParams = {
  productTypeId: string;
  locationId: string;
  period: DateRange;
  // If provided, checks only this specific asset (IDENTIFIED with caller preference).
  // If omitted, picks any available unit of the correct product type.
  assetId?: string;
};

/**
 * Concrete infrastructure service for asset availability queries.
 *
 * Uses raw SQL — tstzrange is unsupported by Prisma's type system.
 * Not abstracted behind a port: it is internal to the inventory module
 * with a single implementation, making the abstraction unnecessary.
 */
@Injectable()
export class AssetAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds one available asset id for the given product type, location, and period.
   * Returns null if no asset is available.
   *
   * The NOT EXISTS subquery checks all assignment types (ORDER, BLACKOUT,
   * MAINTENANCE) — any overlapping assignment blocks availability.
   *
   * Filtering by locationId provides implicit tenant isolation:
   * a location belongs to exactly one tenant, making cross-tenant
   * asset access structurally impossible.
   */
  async findAvailableAssetId(params: FindAvailableParams): Promise<string | null> {
    const period = formatPostgresRange(params.period);

    const assetIdFilter = params.assetId ? Prisma.sql`AND a.id = ${params.assetId}::uuid` : Prisma.empty;

    const rows = await this.prisma.client.$queryRaw<{ id: string }[]>`
      SELECT a.id
      FROM assets a
      WHERE a.product_type_id = ${params.productTypeId}::uuid
        AND a.location_id     = ${params.locationId}::uuid
        AND a.is_active       = true
        AND a.deleted_at      IS NULL
        ${assetIdFilter}
        AND NOT EXISTS (
          SELECT 1
          FROM asset_assignments aa
          WHERE aa.asset_id = a.id
            AND aa.period && ${period}::tstzrange
        )
      LIMIT 1
    `;

    return rows.length > 0 ? rows[0].id : null;
  }
}
