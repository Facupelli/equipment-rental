import { formatPostgresRange, parsePostgresRange } from 'src/core/utils/postgres-range.util';
import { Prisma } from 'src/generated/prisma/client';
import { BookingStatus, TrackingType } from '@repo/types';
import { Money } from '../../domain/value-objects/money.vo';
import { PriceBreakdown } from '../../domain/value-objects/price-breakdown.vo';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { Order } from '../../domain/entities/order.entity';
import { BookingItem } from '../../domain/entities/booking.entity';

interface BookingItemRawRecord {
  id: string;
  tenant_id: string;
  order_id: string;
  inventory_item_id: string | null;
  product_id: string;
  quantity: number;
  unit_price: Prisma.Decimal;
  price_breakdown: unknown;
  bundle_id: string | null;
  tracking_type: TrackingType;
}

export interface OrderRawRecord {
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
  bookings: BookingItemRawRecord[];
}

export interface BookingInsertParams {
  id: string;
  tenantId: string;
  customerId: string;
  bookingRange: string; // cast as ::tstzrange in SQL
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
  orderId: string;
  productId: string;
  inventoryItemId: string | null;
  quantity: number | null;
  unitPrice: Prisma.Decimal;
  priceBreakdown: Prisma.JsonValue;
}

export type OrderUpdateInput = Prisma.OrderUncheckedUpdateInput;

export class OrderMapper {
  static toDomain(raw: OrderRawRecord, currency: string): Order {
    const { start, end } = parsePostgresRange(raw.rental_period);

    const bookings = raw.bookings.map((item) => OrderMapper.bookingItemToDomain(item, currency));

    return Order.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      customerId: raw.customer_id,
      bookingRange: DateRange.create(start, end),
      status: raw.status as BookingStatus,
      bookings,
      subtotal: Money.of(raw.subtotal, currency),
      totalDiscount: Money.of(raw.total_discount, currency),
      totalTax: Money.of(raw.total_tax, currency),
      grandTotal: Money.of(raw.grand_total, currency),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  static toInsertParams(order: Order): BookingInsertParams {
    return {
      id: order.id,
      tenantId: order.tenantId,
      customerId: order.customerId,
      bookingRange: formatPostgresRange(order.bookingRange),
      status: order.status,
      subtotal: order.subtotal.toDecimal(),
      totalDiscount: order.totalDiscount.toDecimal(),
      totalTax: order.totalTax.toDecimal(),
      grandTotal: order.grandTotal.toDecimal(),
      notes: order.notes ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static toBookingItemInsertParams(order: Order): LineItemInsertParams[] {
    return order.bookings.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      inventoryItemId: item.inventoryItemId ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toDecimal(),
      priceBreakdown: item.priceBreakdown?.toJson() ?? Prisma.JsonNull,
    }));
  }

  static toUpdateInput(order: Order): OrderUpdateInput {
    return {
      status: order.status,
      notes: order.notes ?? null,
      subtotal: order.subtotal.toDecimal(),
      totalDiscount: order.totalDiscount.toDecimal(),
      totalTax: order.totalTax.toDecimal(),
      grandTotal: order.grandTotal.toDecimal(),
      updatedAt: order.updatedAt,
    };
  }

  // ── Private: Line Item Helpers ─────────────────────────────────────────────

  private static bookingItemToDomain(raw: BookingItemRawRecord, currency: string): BookingItem {
    if (raw.price_breakdown === null) {
      throw new Error(`BookingLineItem ${raw.id} is missing its priceBreakdown snapshot.`);
    }

    const priceBreakdown = PriceBreakdown.fromJson(raw.price_breakdown);

    return BookingItem.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      orderId: raw.order_id,
      trackingType: raw.tracking_type as TrackingType,
      inventoryItemId: raw.inventory_item_id,
      productId: raw.product_id,
      bundleId: raw.bundle_id,
      quantity: raw.quantity,
      unitPrice: Money.of(raw.unit_price, currency),
      priceBreakdown,
    });
  }
}
