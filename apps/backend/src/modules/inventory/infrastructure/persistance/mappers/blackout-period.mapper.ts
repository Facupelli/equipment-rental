import { parsePostgresRange } from 'src/core/utils/postgres-range.util';
import { BlackoutPeriod } from 'src/modules/inventory/domain/entities/blackout-period.entity';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';

/**
 * Represents the raw shape of a blackout_periods row as returned by
 * Prisma's $queryRaw. Because `blocked_period` is an Unsupported type,
 * Prisma cannot map it automatically — it arrives as a raw string.
 */
export interface BlackoutPeriodRawRecord {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  reason: string;
  blocked_period: string; // e.g. '["2025-06-01 00:00:00+00","2025-06-10 00:00:00+00")'
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Represents the structured data object returned by `toPersistence`.
 * The `blockedPeriodSql` field is a pre-formatted string intended for
 * direct interpolation into a $queryRaw template by the Repository.
 *
 * Separating this value from the rest of the payload keeps the Mapper
 * focused on data translation and lets the Repository own the SQL execution.
 */
export interface BlackoutPeriodPersistenceData {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  reason: string;
  /** ISO string representation of the range, ready for SQL casting: `tstzrange(start, end)` */
  blockedPeriodStart: string;
  blockedPeriodEnd: string;
  created_at: Date;
  updated_at: Date;
}

export class BlackoutPeriodMapper {
  /**
   * The core challenge here is parsing PostgreSQL's `tstzrange` string format.
   * A range like `["2025-06-01 00:00:00+00","2025-06-10 00:00:00+00")` must be
   * split into two Date objects. We strip the bound characters `[`, `(`, `]`, `)`
   * and extract the two ISO timestamps.
   */
  static toDomain(raw: BlackoutPeriodRawRecord): BlackoutPeriod {
    const { start, end } = parsePostgresRange(raw.blocked_period);

    return BlackoutPeriod.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      inventoryItemId: raw.inventory_item_id,
      reason: raw.reason,
      blockedPeriod: DateRange.create(start, end),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  /**
   * Expose the range's
   * start and end as separate ISO strings. The Repository is then responsible
   * for interpolating them into the correct `tstzrange(start, end)` SQL call.
   */
  static toPersistence(entity: BlackoutPeriod): BlackoutPeriodPersistenceData {
    const props = entity.toProps();

    return {
      id: props.id,
      tenant_id: props.tenantId,
      inventory_item_id: props.inventoryItemId,
      reason: props.reason,
      blockedPeriodStart: props.blockedPeriod.start.toISOString(),
      blockedPeriodEnd: props.blockedPeriod.end.toISOString(),
      created_at: props.createdAt,
      updated_at: props.updatedAt,
    };
  }
}
