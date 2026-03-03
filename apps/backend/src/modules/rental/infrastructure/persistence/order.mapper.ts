import { formatPostgresRange, parsePostgresRange } from 'src/core/utils/postgres-range.util';
import { Prisma } from 'src/generated/prisma/client';
import { BookingStatus, TrackingType } from '@repo/types';
import { Money } from '../../domain/value-objects/money.vo';
import { PriceBreakdown } from '../../domain/value-objects/price-breakdown.vo';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { Order } from '../../domain/entities/order.entity';
import { BookingItem } from '../../domain/entities/booking.entity';
import { OrderBundle } from '../../domain/entities/order-bundle.entity';

// ---------------------------------------------------------------------------
// Raw DB record shapes (from $queryRaw)
// ---------------------------------------------------------------------------

interface BookingItemRawRecord {
  id: string;
  tenant_id: string;
  order_id: string;
  inventory_item_id: string | null;
  product_id: string;
  quantity: number | null;
  unit_price: Prisma.Decimal;
  price_breakdown: unknown;
  bundle_id: string | null;
  tracking_type: TrackingType;
}

interface OrderBundleRawRecord {
  id: string;
  tenant_id: string;
  order_id: string;
  bundle_id: string;
  bundle_price: Prisma.Decimal;
  price_breakdown: unknown;
}

export interface OrderRawRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  booking_range: string;
  status: BookingStatus;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  bookings: BookingItemRawRecord[];
  order_bundles: OrderBundleRawRecord[];
}

// ---------------------------------------------------------------------------
// Persistence shapes (input to $executeRaw inserts)
// ---------------------------------------------------------------------------

export interface OrderPersistence {
  id: string;
  tenantId: string;
  customerId: string;
  bookingRange: string; // pre-built tstzrange literal
  status: BookingStatus;
  subtotal: Prisma.Decimal;
  totalDiscount: Prisma.Decimal;
  totalTax: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingItemPersistence {
  id: string;
  orderId: string;
  productId: string;
  bundleId: string | null;
  inventoryItemId: string | null;
  quantity: number | null;
  unitPrice: Prisma.Decimal;
  priceBreakdown: Prisma.JsonValue;
}

export interface OrderBundlePersistence {
  id: string;
  orderId: string;
  tenantId: string;
  bundleId: string;
  bundlePrice: Prisma.Decimal;
  priceBreakdown: Prisma.JsonValue;
}

export type OrderUpdateInput = Prisma.OrderUncheckedUpdateInput;

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export class OrderMapper {
  // ── toDomain ──────────────────────────────────────────────────────────────

  static toDomain(raw: OrderRawRecord, currency: string): Order {
    const { start, end } = parsePostgresRange(raw.booking_range);

    const bookings = raw.bookings.map((item) => OrderMapper.bookingItemToDomain(item, currency));

    const orderBundles = raw.order_bundles.map((bundle) => OrderMapper.orderBundleToDomain(bundle, currency));

    return Order.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      customerId: raw.customer_id,
      bookingRange: DateRange.create(start, end),
      status: raw.status,
      notes: raw.notes ?? undefined,
      bookings,
      orderBundles,
      subtotal: Money.of(raw.subtotal, currency),
      totalDiscount: Money.of(raw.total_discount, currency),
      totalTax: Money.of(raw.total_tax, currency),
      grandTotal: Money.of(raw.grand_total, currency),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  // ── toPersistence ─────────────────────────────────────────────────────────

  static toPersistence(order: Order): OrderPersistence {
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

  static toBookingItemPersistence(order: Order): BookingItemPersistence[] {
    return order.bookings.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      bundleId: item.bundleId ?? null,
      inventoryItemId: item.inventoryItemId ?? null,
      quantity: item.quantity ?? null,
      unitPrice: item.unitPrice.toDecimal(),
      priceBreakdown: item.priceBreakdown?.toJson() ?? Prisma.JsonNull,
    }));
  }

  static toOrderBundlePersistence(order: Order): OrderBundlePersistence[] {
    return order.orderBundles.map((bundle) => ({
      id: bundle.id,
      orderId: bundle.orderId,
      tenantId: bundle.tenantId,
      bundleId: bundle.bundleId,
      bundlePrice: bundle.bundlePrice.toDecimal(),
      priceBreakdown: bundle.priceBreakdown.toJson(),
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

  // ── Private helpers ───────────────────────────────────────────────────────

  private static bookingItemToDomain(raw: BookingItemRawRecord, currency: string): BookingItem {
    if (raw.price_breakdown === null) {
      throw new Error(`BookingItem ${raw.id} is missing its priceBreakdown snapshot.`);
    }

    return BookingItem.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      orderId: raw.order_id,
      trackingType: raw.tracking_type,
      inventoryItemId: raw.inventory_item_id,
      productId: raw.product_id,
      bundleId: raw.bundle_id,
      quantity: raw.quantity,
      unitPrice: Money.of(raw.unit_price, currency),
      priceBreakdown: PriceBreakdown.fromJson(raw.price_breakdown),
    });
  }

  private static orderBundleToDomain(raw: OrderBundleRawRecord, currency: string): OrderBundle {
    if (raw.price_breakdown === null) {
      throw new Error(`OrderBundle ${raw.id} is missing its priceBreakdown snapshot.`);
    }

    return OrderBundle.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      orderId: raw.order_id,
      bundleId: raw.bundle_id,
      bundlePrice: Money.of(raw.bundle_price, currency),
      priceBreakdown: PriceBreakdown.fromJson(raw.price_breakdown),
    });
  }
}
