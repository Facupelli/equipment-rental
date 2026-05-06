import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { OrderListDateLens, OrderListSortBy, OrderListSortDirection } from '@repo/schemas';
import { FulfillmentMethod, OrderStatus } from '@repo/types';
import { Prisma } from 'src/generated/prisma/client';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetOrdersQuery } from './get-orders.query';
import type { GetOrdersResponseDto } from './get-orders.response.dto';

type RawOrderRow = {
  id: string;
  number: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  createdAt: Date;
  pickupAt: Date;
  returnAt: Date;
  customerId: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerCompanyName: string | null;
  customerIsCompany: boolean | null;
  locationId: string;
  locationName: string;
};

type RawCountRow = {
  total: bigint | number;
};

const UPCOMING_EXCLUDED_STATUSES = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
  OrderStatus.EXPIRED,
] as const;

const PICKUP_LOCAL_DATE_SQL = Prisma.sql`(o.period_start AT TIME ZONE COALESCE(l.timezone, t.config->>'timezone'))::date`;
const RETURN_LOCAL_DATE_SQL = Prisma.sql`(o.period_end AT TIME ZONE COALESCE(l.timezone, t.config->>'timezone'))::date`;
const TODAY_LOCAL_DATE_SQL = Prisma.sql`(CURRENT_TIMESTAMP AT TIME ZONE COALESCE(l.timezone, t.config->>'timezone'))::date`;

@QueryHandler(GetOrdersQuery)
export class GetOrdersQueryHandler implements IQueryHandler<GetOrdersQuery, GetOrdersResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrdersQuery): Promise<GetOrdersResponseDto> {
    const offset = (query.page - 1) * query.limit;
    const whereFilters = this.buildWhereFilters(query);
    const orderBy = this.buildOrderBy(query);

    const [rows, countRows] = await Promise.all([
      this.prisma.client.$queryRaw<RawOrderRow[]>(Prisma.sql`
        SELECT
          o.id AS "id",
          o.order_number AS "number",
          o.status AS "status",
          o.fulfillment_method AS "fulfillmentMethod",
          o.created_at AS "createdAt",
          o.period_start AS "pickupAt",
          o.period_end AS "returnAt",
          c.id AS "customerId",
          c.first_name AS "customerFirstName",
          c.last_name AS "customerLastName",
          c.company_name AS "customerCompanyName",
          c.is_company AS "customerIsCompany",
          l.id AS "locationId",
          l.name AS "locationName"
        FROM orders o
        JOIN locations l ON l.id = o.location_id AND l.tenant_id = o.tenant_id
        JOIN tenants t ON t.id = o.tenant_id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE ${Prisma.join(whereFilters, ' AND ')}
        ORDER BY ${orderBy}
        OFFSET ${offset}
        LIMIT ${query.limit}
      `),
      this.prisma.client.$queryRaw<RawCountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS "total"
        FROM orders o
        JOIN locations l ON l.id = o.location_id AND l.tenant_id = o.tenant_id
        JOIN tenants t ON t.id = o.tenant_id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE ${Prisma.join(whereFilters, ' AND ')}
      `),
    ]);

    const total = Number(countRows[0]?.total ?? 0);

    return {
      data: rows.map((row) => ({
        id: row.id,
        number: row.number,
        status: row.status,
        fulfillmentMethod: row.fulfillmentMethod,
        createdAt: row.createdAt,
        pickupAt: row.pickupAt,
        returnAt: row.returnAt,
        customer: row.customerId
          ? {
              id: row.customerId,
              displayName: this.resolveCustomerDisplayName(row),
              isCompany: row.customerIsCompany ?? false,
            }
          : null,
        location: {
          id: row.locationId,
          name: row.locationName,
        },
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  private buildWhereFilters(query: GetOrdersQuery): Prisma.Sql[] {
    const filters: Prisma.Sql[] = [Prisma.sql`o.tenant_id = ${query.tenantId}`, Prisma.sql`o.deleted_at IS NULL`];

    if (query.locationId) {
      filters.push(Prisma.sql`o.location_id = ${query.locationId}`);
    }

    if (query.customerId) {
      filters.push(Prisma.sql`o.customer_id = ${query.customerId}`);
    }

    if (query.statuses?.length) {
      filters.push(Prisma.sql`o.status IN (${Prisma.join(query.statuses)})`);
    }

    if (query.orderNumber) {
      filters.push(Prisma.sql`o.order_number = ${query.orderNumber}`);
    }

    if (query.dateLens) {
      filters.push(this.buildDateLensFilter(query.dateLens));
    }

    return filters;
  }

  private buildDateLensFilter(dateLens: OrderListDateLens): Prisma.Sql {
    switch (dateLens) {
      case 'TODAY':
        return Prisma.sql`(${PICKUP_LOCAL_DATE_SQL} = ${TODAY_LOCAL_DATE_SQL} OR ${RETURN_LOCAL_DATE_SQL} = ${TODAY_LOCAL_DATE_SQL})`;
      case 'UPCOMING':
        return Prisma.sql`${PICKUP_LOCAL_DATE_SQL} >= ${TODAY_LOCAL_DATE_SQL} AND o.status NOT IN (${Prisma.join(UPCOMING_EXCLUDED_STATUSES)})`;
      case 'ACTIVE':
        return Prisma.sql`${PICKUP_LOCAL_DATE_SQL} <= ${TODAY_LOCAL_DATE_SQL} AND ${RETURN_LOCAL_DATE_SQL} >= ${TODAY_LOCAL_DATE_SQL}`;
      case 'PAST':
        return Prisma.sql`${RETURN_LOCAL_DATE_SQL} < ${TODAY_LOCAL_DATE_SQL}`;
      default:
        return Prisma.empty;
    }
  }

  private buildOrderBy(query: GetOrdersQuery): Prisma.Sql {
    const { sortBy, sortDirection } = this.resolveSort(query);
    const directionSql = this.toDirectionSql(sortDirection);

    switch (sortBy) {
      case 'pickupDate':
        return Prisma.sql`${PICKUP_LOCAL_DATE_SQL} ${directionSql}, o.period_start ${directionSql}, o.created_at DESC, o.id DESC`;
      case 'returnDate':
        return Prisma.sql`${RETURN_LOCAL_DATE_SQL} ${directionSql}, o.period_end ${directionSql}, o.created_at DESC, o.id DESC`;
      case 'createdAt':
      default:
        return Prisma.sql`o.created_at ${directionSql}, o.id ${directionSql}`;
    }
  }

  private resolveSort(query: GetOrdersQuery): {
    sortBy: OrderListSortBy;
    sortDirection: OrderListSortDirection;
  } {
    const fallback = this.getDefaultSort(query.dateLens);

    if (!query.sortBy && !query.sortDirection) {
      return fallback;
    }

    const sortBy = query.sortBy ?? fallback.sortBy;
    const sortDirection = query.sortDirection ?? this.getDefaultDirectionForSortBy(sortBy, query.dateLens);

    return { sortBy, sortDirection };
  }

  private getDefaultSort(dateLens?: OrderListDateLens): {
    sortBy: OrderListSortBy;
    sortDirection: OrderListSortDirection;
  } {
    switch (dateLens) {
      case 'UPCOMING':
        return { sortBy: 'pickupDate', sortDirection: 'asc' };
      case 'ACTIVE':
        return { sortBy: 'returnDate', sortDirection: 'asc' };
      case 'PAST':
        return { sortBy: 'returnDate', sortDirection: 'desc' };
      case 'TODAY':
      default:
        return { sortBy: 'createdAt', sortDirection: 'desc' };
    }
  }

  private getDefaultDirectionForSortBy(sortBy: OrderListSortBy, dateLens?: OrderListDateLens): OrderListSortDirection {
    if (sortBy === 'createdAt') {
      return 'desc';
    }

    if (sortBy === 'returnDate' && dateLens === 'PAST') {
      return 'desc';
    }

    return 'asc';
  }

  private toDirectionSql(direction: OrderListSortDirection): Prisma.Sql {
    return direction === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  }

  private resolveCustomerDisplayName(row: RawOrderRow): string {
    if (row.customerIsCompany && row.customerCompanyName) {
      return row.customerCompanyName;
    }

    return `${row.customerFirstName ?? ''} ${row.customerLastName ?? ''}`.trim();
  }
}
