import { Injectable } from '@nestjs/common';
import { BookingRepository } from '../../domain/ports/booking.repository';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingInsertParams, BookingMapper, BookingRawRecord, LineItemInsertParams } from './booking.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { Prisma } from 'src/generated/prisma/client';

interface QuantityRow {
  total: bigint;
}

@Injectable()
export class PrismaBookingRepository extends BookingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(booking: Booking): Promise<string> {
    if (booking.isNew) {
      await this.insert(booking);
    } else {
      await this.update(booking);
    }

    return booking.id;
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

  async getBookedQuantity(
    productId: string,
    tenantId: string,
    range: DateRange,
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
      AND bli.product_id = ${productId}
      -- Consistency Check: Exclude bookings on RETIRED items
      -- (If inventory_item_id is NULL, it's an over-rental, so we count it)
      AND (bli.inventory_item_id IS NULL OR ii.status != 'RETIRED')
  `;

    console.log({ rows });

    return Number(rows[0]?.total ?? 0);
  }

  private async insert(booking: Booking): Promise<void> {
    const b = BookingMapper.toInsertParams(booking);
    const lineItems = BookingMapper.toLineItemInsertParams(booking);

    await this.prisma.client.$transaction([this.insertBookingSql(b), this.insertLineItemsSql(lineItems)]);
  }

  private async update(booking: Booking): Promise<void> {
    const data = BookingMapper.toUpdateInput(booking);

    await this.prisma.client.booking.update({
      where: { id: booking.id },
      data,
    });
  }

  /**
   * Raw INSERT for the bookings table.
   * rentalPeriod is cast explicitly to tstzrange — Prisma cannot generate
   * this because the column type is Unsupported("tstzrange").
   */
  private insertBookingSql(b: BookingInsertParams): Prisma.PrismaPromise<unknown> {
    return this.prisma.client.$queryRaw`
      INSERT INTO bookings (
        id, tenant_id, customer_id, rental_period,
        status, subtotal, total_discount, total_tax, grand_total,
        notes, created_at, updated_at
      ) VALUES (
        ${b.id}, ${b.tenantId}, ${b.customerId}, ${b.rentalPeriod}::tstzrange,
        ${b.status}::"BookingStatus", ${b.subtotal}, ${b.totalDiscount}, ${b.totalTax}, ${b.grandTotal},
        ${b.notes}, ${b.createdAt}, ${b.updatedAt}
      )
    `;
  }

  /**
   * Raw bulk INSERT for booking_line_items.
   * Uses UNNEST for efficiency — one round-trip regardless of item count.
   *
   * If the booking has no line items this is never called
   * (enforced by Booking.create invariant), but we guard anyway.
   */
  private insertLineItemsSql(items: LineItemInsertParams[]): Prisma.PrismaPromise<unknown> {
    if (items.length === 0) {
      // Return a no-op PrismaPromise so the transaction array stays consistent
      return this.prisma.client.$queryRaw`SELECT 1`;
    }

    const ids = items.map((i) => i.id);
    const bookingIds = items.map((i) => i.bookingId);
    const productIds = items.map((i) => i.productId);
    const inventoryItemIds = items.map((i) => i.inventoryItemId);
    const quantitiesRented = items.map((i) => i.quantityRented);
    const unitPrices = items.map((i) => i.unitPrice);
    const lineTotals = items.map((i) => i.lineTotal);
    const ownerIds = items.map((i) => i.ownerId);
    const isExternallySourced = items.map((i) => i.isExternallySourced);
    const priceBreakdowns = items.map((i) => JSON.stringify(i.priceBreakdown));

    return this.prisma.client.$queryRaw`
      INSERT INTO booking_line_items (
        id, booking_id, product_id, inventory_item_id,
        quantity_rented, unit_price, line_total,
        owner_id, is_externally_sourced, price_breakdown
      )
      SELECT
        UNNEST(${ids}::uuid[]),
        UNNEST(${bookingIds}::uuid[]),
        UNNEST(${productIds}::uuid[]),
        UNNEST(${inventoryItemIds}::uuid[]),
        UNNEST(${quantitiesRented}::int[]),
        UNNEST(${unitPrices}::decimal[]),
        UNNEST(${lineTotals}::decimal[]),
        UNNEST(${ownerIds}::uuid[]),
        UNNEST(${isExternallySourced}::boolean[]),
        UNNEST(${priceBreakdowns}::jsonb[])
    `;
  }
}
