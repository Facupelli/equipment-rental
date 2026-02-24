import { Injectable } from '@nestjs/common';
import { BookingRepositoryPort } from '../../domain/ports/booking.repository.port';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingMapper, BookingRawRecord } from './booking.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { TrackingType } from '@repo/types';

interface QuantityRow {
  total: bigint;
}

@Injectable()
export class PrismaBookingRepository extends BookingRepositoryPort {
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
    trackingType: TrackingType,
  ): Promise<number> {
    const start = range.start;
    const end = range.end;

    if (trackingType === TrackingType.SERIALIZED) {
      return this.getBookedQuantitySerialized(productId, tenantId, start, end);
    }

    return this.getBookedQuantityBulk(productId, tenantId, start, end);
  }

  /**
   * SERIALIZED: count distinct physical items already committed to this product
   * in the requested range. Each serialized unit is a unique asset, so distinct
   * counting is used to stay defensive against any duplicates.
   */
  private async getBookedQuantitySerialized(
    productId: string,
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const rows = await this.prisma.client.$queryRaw<QuantityRow[]>`
      SELECT COUNT(DISTINCT bli.inventory_item_id) AS total
      FROM booking_line_items bli
      JOIN bookings b ON b.id = bli.booking_id
      JOIN inventory_items ii ON ii.id = bli.inventory_item_id
      WHERE ii.product_id = ${productId}
        AND b.tenant_id = ${tenantId}
        AND b.status NOT IN ('CANCELLED', 'COMPLETED')
        AND b.rental_period && tstzrange(${start}, ${end})
    `;

    return Number(rows[0]?.total ?? 0);
  }

  /**
   * BULK: sum quantity_rented across all physical line items belonging to this
   * product in the requested range. Units are fungible, so we sum rather than count.
   */
  private async getBookedQuantityBulk(productId: string, tenantId: string, start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.client.$queryRaw<QuantityRow[]>`
      SELECT COALESCE(SUM(bli.quantity_rented), 0) AS total
      FROM booking_line_items bli
      JOIN bookings b ON b.id = bli.booking_id
      JOIN inventory_items ii ON ii.id = bli.inventory_item_id
      WHERE ii.product_id = ${productId}
        AND b.tenant_id = ${tenantId}
        AND b.status NOT IN ('CANCELLED', 'COMPLETED')
        AND b.rental_period && tstzrange(${start}, ${end})
    `;

    return Number(rows[0]?.total ?? 0);
  }
}
