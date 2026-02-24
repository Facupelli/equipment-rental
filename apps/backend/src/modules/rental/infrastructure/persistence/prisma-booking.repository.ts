import { Injectable } from '@nestjs/common';
import { BookingRepository } from '../../domain/ports/booking.repository';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingMapper, BookingRawRecord } from './booking.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';

interface QuantityRow {
  total: bigint;
}

@Injectable()
export class PrismaBookingRepository extends BookingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string, currency: string): Promise<Booking | null> {
    const rows = await this.prisma.client.$queryRaw<BookingRawRecord[]>`
    SELECT
      b.id,
      b.tenant_id,
      b.customer_id,
      b.rental_period::text,
      b.status,
      b.subtotal,
      b.total_discount,
      b.total_tax,
      b.grand_total,
      b.created_at,
      b.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id',                   bli.id,
            'booking_id',           bli.booking_id,
            'inventory_item_id',    bli.inventory_item_id,
            'product_id',           bli.product_id,
            'quantity_rented',      bli.quantity_rented,
            'unit_price',           bli.unit_price,
            'line_total',           bli.line_total,
            'owner_id',             bli.owner_id,
            'is_externally_sourced', bli.is_externally_sourced,
            'price_breakdown',      bli.price_breakdown
          )
        ) FILTER (WHERE bli.id IS NOT NULL),
        '[]'
      ) AS line_items
    FROM bookings b
    LEFT JOIN booking_line_items bli ON bli.booking_id = b.id
    WHERE b.id = ${id}
    GROUP BY b.id
  `;

    if (rows.length === 0) {
      return null;
    }

    return BookingMapper.toDomain(rows[0], currency);
  }

  async save(booking: Booking): Promise<string> {
    const persistenceModel = BookingMapper.toPersistence(booking);

    const createdBooking = await this.prisma.client.booking.create({
      data: persistenceModel,
    });

    return createdBooking.id;
  }

  async getBookedQuantity(
    productId: string,
    tenantId: string,
    range: DateRange,
    // trackingType is kept for potential future logic or logging,
    // but doesn't change the SQL anymore.
    // trackingType: TrackingType,
  ): Promise<number> {
    const { start, end } = range;

    const rows = await this.prisma.client.$queryRaw<QuantityRow[]>`
    SELECT COALESCE(SUM(bli.quantity_rented), 0) AS total
    FROM booking_line_items bli
    JOIN bookings b ON b.id = bli.booking_id
    LEFT JOIN inventory_items ii ON ii.id = bli.inventory_item_id
    WHERE 
      b.tenant_id = ${tenantId}
      AND b.status NOT IN ('CANCELLED', 'COMPLETED')
      AND b.rental_period && tstzrange(${start}, ${end})
      AND (
        ii.product_id = ${productId} 
        OR 
        (bli.inventory_item_id IS NULL AND bli.product_id = ${productId})
      )
  `;

    return Number(rows[0]?.total ?? 0);
  }
}
