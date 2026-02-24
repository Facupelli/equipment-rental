import { parsePostgresRange } from 'src/core/utils/postgres-range.util';
import { Prisma } from 'src/generated/prisma/client';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingStatus } from '@repo/types';
import { Money } from '../../domain/value-objects/money.vo';
import { BookingLineItem } from '../../domain/entities/booking-line-item.entity';
import { PriceBreakdown } from '../../domain/value-objects/price-breakdown.vo';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';

interface LineItemRawRecord {
  id: string;
  booking_id: string;
  inventory_item_id: string | null;
  product_id: string | null;
  quantity_rented: number;
  unit_price: number;
  line_total: number;
  owner_id: string | null;
  is_externally_sourced: boolean;
  price_breakdown: unknown;
}

export interface BookingRawRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  rental_period: string;
  status: BookingStatus;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  created_at: Date;
  updated_at: Date;
  line_items: LineItemRawRecord[];
}

export class BookingMapper {
  static toDomain(raw: BookingRawRecord, currency: string): Booking {
    const { start, end } = parsePostgresRange(raw.rental_period);

    const lineItems = raw.line_items.map((item) => BookingMapper.lineItemToDomain(item, currency));

    return Booking.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      customerId: raw.customer_id,
      rentalPeriod: DateRange.create(start, end),
      status: raw.status as BookingStatus,
      lineItems,
      subtotal: Money.of(raw.subtotal, currency),
      totalDiscount: Money.of(raw.total_discount, currency),
      totalTax: Money.of(raw.total_tax, currency),
      grandTotal: Money.of(raw.grand_total, currency),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  static toPersistence(booking: Booking): Prisma.BookingUncheckedCreateInput {
    return {
      id: booking.id,
      tenantId: booking.tenantId,
      customerId: booking.customerId,
      status: booking.status,
      subtotal: booking.subtotal.toDecimal(),
      totalDiscount: booking.totalDiscount.toDecimal(),
      totalTax: booking.totalTax.toDecimal(),
      grandTotal: booking.grandTotal.toDecimal(),
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      lineItems: {
        create: booking.lineItems.map(BookingMapper.lineItemToPersistence),
      },
    };
  }

  // ── Private: Line Item Helpers ─────────────────────────────────────────────

  private static lineItemToDomain(raw: LineItemRawRecord, currency: string): BookingLineItem {
    if (raw.price_breakdown === null) {
      throw new Error(`BookingLineItem ${raw.id} is missing its priceBreakdown snapshot.`);
    }

    const priceBreakdown = PriceBreakdown.fromJson(raw.price_breakdown, currency);

    return BookingLineItem.reconstitute({
      id: raw.id,
      bookingId: raw.booking_id,
      inventoryItemId: raw.inventory_item_id,
      productId: raw.product_id,
      quantityRented: raw.quantity_rented,
      unitPrice: Money.of(raw.unit_price, currency),
      lineTotal: Money.of(raw.line_total, currency),
      ownerId: raw.owner_id,
      isExternallySourced: raw.is_externally_sourced,
      priceBreakdown,
    });
  }

  private static lineItemToPersistence(
    item: BookingLineItem,
  ): Prisma.BookingLineItemUncheckedCreateWithoutBookingInput {
    return {
      id: item.id,
      inventoryItemId: item.inventoryItemId ?? undefined,
      productId: item.productId ?? undefined,
      quantityRented: item.quantityRented,
      unitPrice: item.unitPrice.toDecimal(),
      lineTotal: item.lineTotal.toDecimal(),
      ownerId: item.ownerId ?? undefined,
      isExternallySourced: item.isExternallySourced,
      priceBreakdown: item.priceBreakdown?.toJson() ?? Prisma.JsonNull,
    };
  }
}
