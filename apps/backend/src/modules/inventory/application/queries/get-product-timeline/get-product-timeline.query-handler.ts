import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { ProductTimelineAssetRow, ProductTimelineBlock, TenantConfig } from '@repo/schemas';
import { AssignmentType, OrderStatus, TrackingMode } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';

import { GetProductTimelineQuery } from './get-product-timeline.query';
import { GetProductTimelineResponse } from './get-product-timeline.response.dto';

const OPERATIONAL_ORDER_STATUSES = [OrderStatus.CONFIRMED, OrderStatus.ACTIVE] as const;

type TimelineAssignmentRow = {
  blockId: string;
  assetId: string;
  type: AssignmentType;
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
  orderId: string | null;
  orderNumber: number | null;
  orderStatus: OrderStatus | null;
  customerId: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerCompanyName: string | null;
  customerIsCompany: boolean | null;
};

type CurrentBlockingRow = {
  assetId: string;
  type: AssignmentType;
};

@QueryHandler(GetProductTimelineQuery)
export class GetProductTimelineQueryHandler implements IQueryHandler<
  GetProductTimelineQuery,
  GetProductTimelineResponse | null
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetProductTimelineQuery): Promise<GetProductTimelineResponse | null> {
    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(query.tenantId),
    );

    if (!tenantConfig) {
      throw new Error(`Tenant config not found for tenant "${query.tenantId}"`);
    }

    const [productType, location, assets] = await Promise.all([
      this.prisma.client.productType.findFirst({
        where: {
          id: query.productTypeId,
          tenantId: query.tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          trackingMode: true,
        },
      }),
      this.prisma.client.location.findFirst({
        where: {
          id: query.locationId,
          tenantId: query.tenantId,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      this.prisma.client.asset.findMany({
        where: {
          productTypeId: query.productTypeId,
          locationId: query.locationId,
          deletedAt: null,
          location: {
            tenantId: query.tenantId,
          },
        },
        select: {
          id: true,
          serialNumber: true,
          notes: true,
          isActive: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ serialNumber: 'asc' }, { id: 'asc' }],
      }),
    ]);

    if (!productType || !location) {
      return null;
    }

    const requestedRange = DateRange.create(new Date(query.from), new Date(query.to));
    const now = new Date();

    const [timelineRows, currentBlockingRows] = await Promise.all([
      this.fetchTimelineRows(query, requestedRange),
      this.fetchCurrentBlockingRows(query, now),
    ]);

    const timelineByAssetId = new Map<string, ProductTimelineBlock[]>();

    for (const row of timelineRows) {
      const blocks = timelineByAssetId.get(row.assetId) ?? [];
      blocks.push(this.toTimelineBlock(row, now));
      timelineByAssetId.set(row.assetId, blocks);
    }

    for (const blocks of timelineByAssetId.values()) {
      blocks.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));
    }

    const assetRows: ProductTimelineAssetRow[] = assets.map((asset) => ({
      asset: {
        id: asset.id,
        serialNumber: asset.serialNumber,
        notes: asset.notes,
        isActive: asset.isActive,
        owner: asset.owner,
      },
      timeline: timelineByAssetId.get(asset.id) ?? [],
    }));

    const currentBlockTypeByAssetId = new Map(currentBlockingRows.map((row) => [row.assetId, row.type]));
    const activeAssets = assets.filter((asset) => asset.isActive);
    const blockedActiveAssetsNow = activeAssets.filter((asset) => currentBlockTypeByAssetId.has(asset.id)).length;

    return {
      productType: {
        id: productType.id,
        name: productType.name,
        trackingMode: productType.trackingMode as TrackingMode,
      },
      location: {
        id: location.id,
        name: location.name,
      },
      range: {
        from: requestedRange.start.toISOString(),
        to: requestedRange.end.toISOString(),
        timezone: tenantConfig.timezone,
      },
      summary: {
        totalAssets: assets.length,
        activeAssets: activeAssets.length,
        inactiveAssets: assets.length - activeAssets.length,
        availableNow: activeAssets.length - blockedActiveAssetsNow,
        inOrderNow: currentBlockingRows.filter((row) => row.type === AssignmentType.ORDER).length,
        inBlackoutNow: currentBlockingRows.filter((row) => row.type === AssignmentType.BLACKOUT).length,
        inMaintenanceNow: currentBlockingRows.filter((row) => row.type === AssignmentType.MAINTENANCE).length,
      },
      assets: assetRows,
    };
  }

  private async fetchTimelineRows(
    query: GetProductTimelineQuery,
    requestedRange: DateRange,
  ): Promise<TimelineAssignmentRow[]> {
    const overlapRange = formatPostgresRange(requestedRange);

    return this.prisma.client.$queryRaw<TimelineAssignmentRow[]>`
      SELECT
        aa.id AS "blockId",
        aa.asset_id AS "assetId",
        aa.type AS "type",
        lower(aa.period) AS "startsAt",
        upper(aa.period) AS "endsAt",
        aa.reason AS "reason",
        o.id AS "orderId",
        o.order_number AS "orderNumber",
        o.status AS "orderStatus",
        c.id AS "customerId",
        c.first_name AS "customerFirstName",
        c.last_name AS "customerLastName",
        c.company_name AS "customerCompanyName",
        c.is_company AS "customerIsCompany"
      FROM asset_assignments aa
      JOIN assets a ON a.id = aa.asset_id
      LEFT JOIN orders o ON o.id = aa.order_id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE a.product_type_id = ${query.productTypeId}
        AND a.location_id = ${query.locationId}
        AND a.deleted_at IS NULL
        AND aa.period && ${overlapRange}::tstzrange
        AND (
          aa.type <> ${AssignmentType.ORDER}
          OR (
            o.tenant_id = ${query.tenantId}
            AND o.deleted_at IS NULL
            AND o.status IN (${OPERATIONAL_ORDER_STATUSES[0]}, ${OPERATIONAL_ORDER_STATUSES[1]})
          )
        )
      ORDER BY a.serial_number ASC NULLS FIRST, a.id ASC, lower(aa.period) ASC, aa.id ASC
    `;
  }

  private async fetchCurrentBlockingRows(query: GetProductTimelineQuery, now: Date): Promise<CurrentBlockingRow[]> {
    return this.prisma.client.$queryRaw<CurrentBlockingRow[]>`
      SELECT DISTINCT ON (aa.asset_id)
        aa.asset_id AS "assetId",
        aa.type AS "type"
      FROM asset_assignments aa
      JOIN assets a ON a.id = aa.asset_id
      LEFT JOIN orders o ON o.id = aa.order_id
      WHERE a.product_type_id = ${query.productTypeId}
        AND a.location_id = ${query.locationId}
        AND a.deleted_at IS NULL
        AND aa.period @> ${now.toISOString()}::timestamptz
        AND (
          aa.type <> ${AssignmentType.ORDER}
          OR (
            o.tenant_id = ${query.tenantId}
            AND o.deleted_at IS NULL
            AND o.status IN (${OPERATIONAL_ORDER_STATUSES[0]}, ${OPERATIONAL_ORDER_STATUSES[1]})
          )
        )
      ORDER BY aa.asset_id ASC, aa.id ASC
    `;
  }

  private toTimelineBlock(row: TimelineAssignmentRow, now: Date): ProductTimelineBlock {
    const customer = row.customerId
      ? {
          id: row.customerId,
          displayName: this.resolveCustomerDisplayName(row),
          isCompany: row.customerIsCompany ?? false,
        }
      : null;

    const order =
      row.orderId && row.orderNumber !== null && row.orderStatus
        ? {
            id: row.orderId,
            number: row.orderNumber,
            status: row.orderStatus,
            customer,
          }
        : null;

    return {
      id: row.blockId,
      type: row.type,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      label: this.buildLabel(row, customer?.displayName ?? null),
      status: this.resolveBlockStatus(row.startsAt, row.endsAt, now),
      order,
      reason: row.type === AssignmentType.ORDER ? null : row.reason,
    };
  }

  private buildLabel(row: TimelineAssignmentRow, customerDisplayName: string | null): string {
    if (row.type === AssignmentType.ORDER) {
      const base = `Pedido #${row.orderNumber ?? ''}`.trim();
      return customerDisplayName ? `${base} · ${customerDisplayName}` : base;
    }

    if (row.type === AssignmentType.BLACKOUT) {
      return row.reason?.trim() || 'Blackout';
    }

    return row.reason?.trim() || 'Mantenimiento';
  }

  private resolveBlockStatus(startsAt: Date, endsAt: Date, now: Date): 'active' | 'upcoming' | 'past' {
    if (startsAt <= now && now < endsAt) {
      return 'active';
    }

    if (startsAt > now) {
      return 'upcoming';
    }

    return 'past';
  }

  private resolveCustomerDisplayName(row: TimelineAssignmentRow): string {
    if (row.customerIsCompany && row.customerCompanyName) {
      return row.customerCompanyName;
    }

    return `${row.customerFirstName ?? ''} ${row.customerLastName ?? ''}`.trim();
  }
}
