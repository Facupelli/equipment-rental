import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { OrderRepositoryPort } from '../../application/ports/order.repository.port';
import { Order } from '../../domain/entities/order.entity';
import { OrderMapper } from './order.mapper';

@Injectable()
export class PrismaOrderRepository extends OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(booking: Order): Promise<string> {
    const orderData = OrderMapper.toPersistence(booking);
    const bookingsData = OrderMapper.toBookingItemPersistence(booking);
    const orderBundleData = OrderMapper.toOrderBundlePersistence(booking);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`
         INSERT INTO orders (
            id, tenant_id, customer_id, status,
            booking_range,
            subtotal, total_discount, total_tax, grand_total,
            created_at, updated_at
          ) VALUES (
            ${orderData.id}::uuid,
            ${orderData.tenantId}::uuid,
            ${orderData.customerId}::uuid,
            'RESERVED',
            ${orderData.bookingRange}::tstzrange,
            ${orderData.subtotal},
            0,
            0,
            ${orderData.grandTotal},
            NOW(), NOW()
          )
      `;

      for (const booking of bookingsData) {
        await tx.$executeRaw`
            INSERT INTO bookings (
              id, tenant_id, order_id, product_id, bundle_id,
              inventory_item_id, quantity,
              unit_price, price_breakdown,
              booking_range,
              created_at, updated_at
            ) VALUES (
              ${booking.id}::uuid,
              ${orderData.tenantId}::uuid,
              ${orderData.id}::uuid,
              ${booking.productId}::uuid,
              ${booking.bundleId}::uuid,
              ${booking.inventoryItemId}::uuid,
              ${booking.quantity},
              ${booking.unitPrice},
              ${JSON.stringify(booking.priceBreakdown)}::jsonb,
              ${orderData.bookingRange}::tstzrange,
              NOW(), NOW()
            )
          `;
      }

      for (const bundle of orderBundleData) {
        await tx.$executeRaw`
            INSERT INTO order_bundles (
              id, tenant_id, order_id, bundle_id,
              bundle_price, price_breakdown,
              created_at, updated_at
            ) VALUES (
              ${bundle.id}::uuid,
              ${orderData.tenantId}::uuid,
              ${orderData.id}::uuid,
              ${bundle.bundleId}::uuid,
              ${bundle.bundlePrice},
              ${JSON.stringify(bundle.priceBreakdown)}::jsonb,
              NOW(), NOW()
            )
          `;
      }
    });

    return orderData.id;
  }
}
