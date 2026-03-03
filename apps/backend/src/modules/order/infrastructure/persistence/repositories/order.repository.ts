import { Injectable } from '@nestjs/common';
import {
  OrderMapper,
  OrderItemMapper,
  BundleSnapshotMapper,
  BundleSnapshotComponentMapper,
} from '../mappers/order.mapper';
import { OrderStatus } from '@repo/types';
import { OrderRepositoryPort } from 'src/modules/order/domain/ports/order.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { Order } from 'src/modules/order/domain/entities/order.entity';

export class CannotRemoveItemFromActiveOrderException extends Error {
  constructor(orderId: string, status: OrderStatus) {
    super(
      `Cannot remove items from order '${orderId}' with status '${status}'. ` +
        `Items can only be removed from orders in PENDING_SOURCING status.`,
    );
    this.name = 'CannotRemoveItemFromActiveOrderException';
  }
}

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Order | null> {
    const raw = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            bundleSnapshot: {
              include: { components: true },
            },
          },
        },
      },
    });
    if (!raw) return null;
    return OrderMapper.toDomain(raw);
  }

  async save(order: Order): Promise<string> {
    const rootData = OrderMapper.toPersistence(order);
    const currentItems = order.getItems();
    const currentItemIds = new Set(currentItems.map((i) => i.id));

    await this.prisma.client.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: order.id },
        create: rootData,
        update: rootData,
      });

      const existingItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
        select: { id: true },
      });
      const existingItemIds = new Set(existingItems.map((i) => i.id));

      // 3. Guard: never remove items from orders past PENDING_SOURCING
      const toDelete = [...existingItemIds].filter((id) => !currentItemIds.has(id));
      if (toDelete.length > 0 && order.currentStatus !== OrderStatus.PENDING_SOURCING) {
        throw new CannotRemoveItemFromActiveOrderException(order.id, order.currentStatus);
      }

      // 4. Delete removed items — bundleSnapshot and components cascade via FK
      if (toDelete.length > 0) {
        await tx.orderItem.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // 5. Insert new items only — order items are immutable once created
      const toInsert = currentItems.filter((i) => !existingItemIds.has(i.id));
      for (const item of toInsert) {
        const itemData = OrderItemMapper.toPersistence(item);
        await tx.orderItem.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData,
        });

        // 6. Insert bundle snapshot and its components if present
        if (item.bundleSnapshot) {
          const snapshotData = BundleSnapshotMapper.toPersistence(item.bundleSnapshot);
          await tx.bundleSnapshot.upsert({
            where: { id: item.bundleSnapshot.id },
            create: snapshotData,
            update: snapshotData,
          });

          for (const component of item.bundleSnapshot.components) {
            const componentData = BundleSnapshotComponentMapper.toPersistence(component);
            await tx.bundleSnapshotComponent.upsert({
              where: { id: component.id },
              create: componentData,
              update: componentData,
            });
          }
        }
      }
    });

    return order.id;
  }
}
