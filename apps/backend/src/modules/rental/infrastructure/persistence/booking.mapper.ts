import { formatPostgresRange, parsePostgresRange } from 'src/core/utils/postgres-range.util';
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
  product_id: string;
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
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  line_items: LineItemRawRecord[];
}

export interface BookingInsertParams {
  id: string;
  tenantId: string;
  customerId: string;
  rentalPeriod: string; // cast as ::tstzrange in SQL
  status: BookingStatus;
  subtotal: Prisma.Decimal;
  totalDiscount: Prisma.Decimal;
  totalTax: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItemInsertParams {
  id: string;
  bookingId: string;
  productId: string;
  inventoryItemId: string | null;
  quantityRented: number;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  ownerId: string | null;
  isExternallySourced: boolean;
  priceBreakdown: Prisma.JsonValue;
}

export type BookingUpdateInput = Prisma.BookingUncheckedUpdateInput;

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

  static toInsertParams(booking: Booking): BookingInsertParams {
    return {
      id: booking.id,
      tenantId: booking.tenantId,
      customerId: booking.customerId,
      rentalPeriod: formatPostgresRange(booking.rentalPeriod),
      status: booking.status,
      subtotal: booking.subtotal.toDecimal(),
      totalDiscount: booking.totalDiscount.toDecimal(),
      totalTax: booking.totalTax.toDecimal(),
      grandTotal: booking.grandTotal.toDecimal(),
      notes: booking.notes ?? null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  static toLineItemInsertParams(booking: Booking): LineItemInsertParams[] {
    return booking.lineItems.map(BookingMapper.lineItemToInsertParams);
  }

  static toUpdateInput(booking: Booking): BookingUpdateInput {
    return {
      status: booking.status,
      notes: booking.notes ?? null,
      subtotal: booking.subtotal.toDecimal(),
      totalDiscount: booking.totalDiscount.toDecimal(),
      totalTax: booking.totalTax.toDecimal(),
      grandTotal: booking.grandTotal.toDecimal(),
      updatedAt: booking.updatedAt,
    };
  }

  // ── Private: Line Item Helpers ─────────────────────────────────────────────

  private static lineItemToDomain(raw: LineItemRawRecord, currency: string): BookingLineItem {
    if (raw.price_breakdown === null) {
      throw new Error(`BookingLineItem ${raw.id} is missing its priceBreakdown snapshot.`);
    }

    const priceBreakdown = PriceBreakdown.fromJson(raw.price_breakdown);

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

  private static lineItemToInsertParams(item: BookingLineItem): LineItemInsertParams {
    return {
      id: item.id,
      bookingId: item.bookingId,
      productId: item.productId,
      inventoryItemId: item.inventoryItemId ?? null,
      quantityRented: item.quantityRented,
      unitPrice: item.unitPrice.toDecimal(),
      lineTotal: item.lineTotal.toDecimal(),
      ownerId: item.ownerId ?? null,
      isExternallySourced: item.isExternallySourced,
      priceBreakdown: item.priceBreakdown?.toJson() ?? Prisma.JsonNull,
    };
  }
}
