import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCalendarDotsQuery } from './get-calendar-dots.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetCalendarDotsResponseDto } from '@repo/schemas';
import { OrderStatus } from '@repo/types';

type RawDateRow = { date: string };

@QueryHandler(GetCalendarDotsQuery)
export class GetCalendarDotsQueryHandler implements IQueryHandler<GetCalendarDotsQuery, GetCalendarDotsResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCalendarDotsQuery): Promise<GetCalendarDotsResponseDto> {
    const { locationId, from, to } = query;

    const [pickupRows, returnRows] = await Promise.all([
      this.fetchPickupDates(locationId, from, to),
      this.fetchReturnDates(locationId, from, to),
    ]);

    return {
      pickupDates: pickupRows.map((r) => r.date),
      returnDates: returnRows.map((r) => r.date),
    };
  }

  private async fetchPickupDates(locationId: string, from: string, to: string): Promise<RawDateRow[]> {
    return this.prisma.client.$queryRaw<RawDateRow[]>`
      SELECT DISTINCT lower(aa.period)::date::text AS date
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN asset_assignments aa ON aa.order_item_id = oi.id
      WHERE
        o.location_id = ${locationId}
        AND o.deleted_at IS NULL
        AND o.status != ${OrderStatus.CANCELLED}
        AND lower(aa.period)::date BETWEEN ${from}::date AND ${to}::date
    `;
  }

  private async fetchReturnDates(locationId: string, from: string, to: string): Promise<RawDateRow[]> {
    return this.prisma.client.$queryRaw<RawDateRow[]>`
      SELECT DISTINCT upper(aa.period)::date::text AS date
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN asset_assignments aa ON aa.order_item_id = oi.id
      WHERE
        o.location_id = ${locationId}
        AND o.deleted_at IS NULL
        AND o.status != ${OrderStatus.CANCELLED}
        AND upper(aa.period)::date BETWEEN ${from}::date AND ${to}::date
    `;
  }
}
