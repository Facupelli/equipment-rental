import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersScheduleQuery } from './get-orders-schedule.query';
import { GetOrdersScheduleResponse, OrderSummary, ScheduleEvent } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';
import { OrderStatus } from '@repo/types';

type RawOrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  period_start: string;
  period_end: string;
  customer_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_company_name: string | null;
  customer_is_company: boolean | null;
};

@QueryHandler(GetOrdersScheduleQuery)
export class GetOrdersScheduleQueryHandler implements IQueryHandler<GetOrdersScheduleQuery, GetOrdersScheduleResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrdersScheduleQuery): Promise<GetOrdersScheduleResponse> {
    const { locationId, from, to } = query;

    const [pickupRows, returnRows] = await Promise.all([
      this.fetchPickups(locationId, from, to),
      this.fetchReturns(locationId, from, to),
    ]);

    const pickupEvents: ScheduleEvent[] = pickupRows.map((row) => ({
      eventType: 'PICKUP',
      eventDate: row.period_start,
      order: this.buildOrderSummary(row),
    }));

    const returnEvents: ScheduleEvent[] = returnRows.map((row) => ({
      eventType: 'RETURN',
      eventDate: row.period_end,
      order: this.buildOrderSummary(row),
    }));

    const events = [...pickupEvents, ...returnEvents].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

    return { events };
  }

  // Orders whose rental period starts within [from, to].
  // DISTINCT ON (o.id) ensures one row per order even when the order
  // has multiple items — each with its own asset_assignment row.
  private async fetchPickups(locationId: string, from: string, to: string): Promise<RawOrderRow[]> {
    return this.prisma.client.$queryRaw<RawOrderRow[]>`
      SELECT DISTINCT ON (o.id)
        o.id,
        o.status,
        o.order_number,
        lower(aa.period)::text AS period_start,
        upper(aa.period)::text AS period_end,
        c.id                   AS customer_id,
        c.first_name           AS customer_first_name,
        c.last_name            AS customer_last_name,
        c.company_name         AS customer_company_name,
        c.is_company           AS customer_is_company
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN asset_assignments aa ON aa.order_item_id = oi.id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE
        o.location_id = ${locationId}
        AND o.deleted_at IS NULL
        AND o.status != ${OrderStatus.CANCELLED}
        AND lower(aa.period)::date BETWEEN ${from}::date AND ${to}::date
    `;
  }

  // Orders whose rental period ends within [from, to].
  private async fetchReturns(locationId: string, from: string, to: string): Promise<RawOrderRow[]> {
    return this.prisma.client.$queryRaw<RawOrderRow[]>`
      SELECT DISTINCT ON (o.id)
        o.id,
        o.status,
        o.order_number,
        lower(aa.period)::text AS period_start,
        upper(aa.period)::text AS period_end,
        c.id                   AS customer_id,
        c.first_name           AS customer_first_name,
        c.last_name            AS customer_last_name,
        c.company_name         AS customer_company_name,
        c.is_company           AS customer_is_company
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN asset_assignments aa ON aa.order_item_id = oi.id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE
        o.location_id = ${locationId}
        AND o.deleted_at IS NULL
        AND o.status != ${OrderStatus.CANCELLED}
        AND upper(aa.period)::date BETWEEN ${from}::date AND ${to}::date
    `;
  }

  private buildOrderSummary(row: RawOrderRow): OrderSummary {
    return {
      id: row.id,
      status: row.status,
      number: row.order_number,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      customer: row.customer_id
        ? {
            id: row.customer_id,
            displayName: this.resolveDisplayName(row),
            isCompany: row.customer_is_company ?? false,
          }
        : null,
    };
  }

  private resolveDisplayName(row: RawOrderRow): string {
    if (row.customer_is_company && row.customer_company_name) {
      return row.customer_company_name;
    }
    return `${row.customer_first_name ?? ''} ${row.customer_last_name ?? ''}`.trim();
  }
}
