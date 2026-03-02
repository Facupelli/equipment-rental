import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  BookingCard,
  GetTodayOverviewResponse,
  GetUpcomingScheduleResponse,
  ProductSummary,
  ReturnCard,
  UpcomingBooking,
} from '@repo/schemas';
import { OrdersQueryPort } from '../../application/ports/booking-query.port';

// ─── Raw SQL Row Types ─────────────────────────────────────────────────────────
// These types represent the raw rows returned by $queryRaw before mapping.
// They are private to this file — nothing outside should depend on them.

interface TodayBookingRow {
  booking_id: string;
  customer_name: string;
  first_product_name: string;
  line_item_count: bigint; // Postgres COUNT returns bigint — must be cast
  scheduled_time: Date;
  status: string;
}

interface TodayReturnRow extends TodayBookingRow {
  scheduled_return_time: Date;
  is_overdue: boolean;
}

interface UpcomingBookingRow {
  booking_id: string;
  customer_name: string;
  first_product_name: string;
  line_item_count: bigint;
  rental_date: string; // DATE cast returned as string: "YYYY-MM-DD"
  status: string;
}

// ─── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class PrismaOrderQueryRepository implements OrdersQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  // ─── getTodayOverview ──────────────────────────────────────────────────────

  async getTodayOverview(tenantId: string, tenantTimezone: string): Promise<GetTodayOverviewResponse> {
    const [scheduledOutRows, dueBackRows] = await Promise.all([
      this.fetchTodayPickUps(tenantId, tenantTimezone),
      this.fetchTodayReturns(tenantId, tenantTimezone),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      pickUpsCount: scheduledOutRows.length,
      returnsCount: dueBackRows.length,
      scheduledOut: scheduledOutRows.map((row) => this.toBookingCard(row)),
      dueBack: dueBackRows.map((row) => this.toReturnCard(row)),
    };
  }

  private async fetchTodayPickUps(tenantId: string, tenantTimezone: string): Promise<TodayBookingRow[]> {
    return this.prisma.client.$queryRaw<TodayBookingRow[]>`
      SELECT
        b.id                                              AS booking_id,
        c.name                                            AS customer_name,
        MIN(p.name)                                       AS first_product_name,
        COUNT(bli.id)                                     AS line_item_count,
        lower(b.rental_period)                            AS scheduled_time,
        b.status
      FROM bookings b
      JOIN customers c   ON c.id  = b.customer_id
      JOIN booking_line_items bli ON bli.booking_id = b.id
      JOIN products p    ON p.id  = bli.product_id
      WHERE
        b.tenant_id = ${tenantId}
        -- Cast the range lower bound to the tenant's local date for comparison
        AND (lower(b.rental_period) AT TIME ZONE ${tenantTimezone})::date
              = (now() AT TIME ZONE ${tenantTimezone})::date
        AND b.status IN ('RESERVED', 'ACTIVE', 'PENDING_CONFIRMATION')
      GROUP BY b.id, c.name, b.status, b.rental_period
      ORDER BY lower(b.rental_period) ASC
    `;
  }

  private async fetchTodayReturns(tenantId: string, tenantTimezone: string): Promise<TodayReturnRow[]> {
    return this.prisma.client.$queryRaw<TodayReturnRow[]>`
      SELECT
        b.id                                              AS booking_id,
        c.name                                            AS customer_name,
        MIN(p.name)                                       AS first_product_name,
        COUNT(bli.id)                                     AS line_item_count,
        upper(b.rental_period)                            AS scheduled_return_time,
        -- Overdue: the return window has passed but the booking is still active
        (upper(b.rental_period) < now() AND b.status = 'ACTIVE') AS is_overdue,
        b.status
      FROM bookings b
      JOIN customers c   ON c.id  = b.customer_id
      JOIN booking_line_items bli ON bli.booking_id = b.id
      JOIN products p    ON p.id  = bli.product_id
      WHERE
        b.tenant_id = ${tenantId}
        AND (upper(b.rental_period) AT TIME ZONE ${tenantTimezone})::date
              = (now() AT TIME ZONE ${tenantTimezone})::date
        AND b.status IN ('ACTIVE', 'RESERVED')
      GROUP BY b.id, c.name, b.status, b.rental_period
      ORDER BY upper(b.rental_period) ASC
    `;
  }

  // ─── getUpcomingSchedule ───────────────────────────────────────────────────

  async getUpcomingSchedule(tenantId: string, tenantTimezone: string): Promise<GetUpcomingScheduleResponse> {
    const rows = await this.fetchUpcomingBookings(tenantId, tenantTimezone);

    return {
      generatedAt: new Date().toISOString(),
      days: this.groupByDate(rows),
    };
  }

  private async fetchUpcomingBookings(tenantId: string, tenantTimezone: string): Promise<UpcomingBookingRow[]> {
    return this.prisma.client.$queryRaw<UpcomingBookingRow[]>`
      SELECT
        b.id                                                          AS booking_id,
        c.name                                                        AS customer_name,
        MIN(p.name)                                                   AS first_product_name,
        COUNT(bli.id)                                                 AS line_item_count,
        -- Return the date in the tenant's timezone as a plain YYYY-MM-DD string
        to_char(
          (lower(b.rental_period) AT TIME ZONE ${tenantTimezone}),
          'YYYY-MM-DD'
        )                                                             AS rental_date,
        b.status
      FROM bookings b
      JOIN customers c   ON c.id  = b.customer_id
      JOIN booking_line_items bli ON bli.booking_id = b.id
      JOIN products p    ON p.id  = bli.product_id
      WHERE
        b.tenant_id = ${tenantId}
        AND (lower(b.rental_period) AT TIME ZONE ${tenantTimezone})::date
              > (now() AT TIME ZONE ${tenantTimezone})::date
        AND (lower(b.rental_period) AT TIME ZONE ${tenantTimezone})::date
              <= (now() AT TIME ZONE ${tenantTimezone})::date + interval '7 days'
        AND b.status IN ('RESERVED', 'ACTIVE', 'PENDING_CONFIRMATION')
      GROUP BY b.id, c.name, b.status, b.rental_period
      ORDER BY rental_date ASC, lower(b.rental_period) ASC
    `;
  }

  /**
   * Folds flat SQL rows into the nested UpcomingDay[] shape.
   * SQL returns one row per booking — we group them by their local date.
   * Map preserves insertion order, so chronological order from the query is maintained.
   */
  private groupByDate(rows: UpcomingBookingRow[]): GetUpcomingScheduleResponse['days'] {
    const dayMap = new Map<string, UpcomingBooking[]>();

    for (const row of rows) {
      if (!dayMap.has(row.rental_date)) {
        dayMap.set(row.rental_date, []);
      }
      dayMap.get(row.rental_date)!.push(this.toUpcomingBooking(row));
    }

    return Array.from(dayMap.entries()).map(([date, bookings]) => ({
      date,
      bookings,
    }));
  }

  // ─── Row Mappers ───────────────────────────────────────────────────────────

  private toProductSummary(row: TodayBookingRow | UpcomingBookingRow): ProductSummary {
    return {
      firstName: row.first_product_name,
      // COUNT returns bigint in Prisma $queryRaw — cast to number for the DTO
      additionalCount: Math.max(0, Number(row.line_item_count) - 1),
    };
  }

  private toBookingCard(row: TodayBookingRow): BookingCard {
    return {
      bookingId: row.booking_id,
      customerName: row.customer_name,
      productSummary: this.toProductSummary(row),
      scheduledTime: row.scheduled_time.toISOString(),
      status: row.status as BookingCard['status'],
    };
  }

  private toReturnCard(row: TodayReturnRow): ReturnCard {
    return {
      bookingId: row.booking_id,
      customerName: row.customer_name,
      productSummary: this.toProductSummary(row),
      scheduledReturnTime: row.scheduled_return_time.toISOString(),
      isOverdue: row.is_overdue,
      status: row.status as ReturnCard['status'],
    };
  }

  private toUpcomingBooking(row: UpcomingBookingRow): UpcomingBooking {
    return {
      bookingId: row.booking_id,
      customerName: row.customer_name,
      productSummary: this.toProductSummary(row),
      status: row.status as UpcomingBooking['status'],
    };
  }
}
