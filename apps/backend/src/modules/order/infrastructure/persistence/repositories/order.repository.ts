import { Injectable } from '@nestjs/common';
import { OrderMapper } from '../mappers/order.mapper';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { PrismaService } from 'src/core/database/prisma.service';
import { Order } from 'src/modules/order/domain/entities/order.entity';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string, tenantId: string): Promise<Order | null> {
    const raw = await this.prisma.client.order.findFirst({
      where: { id, tenantId },
      include: {
        deliveryRequest: true,
        items: {
          include: {
            bundleSnapshot: {
              include: { components: true },
            },
            ownerSplits: true,
          },
        },
      },
    });

    if (!raw) {
      return null;
    }

    return OrderMapper.toDomain(raw);
  }

  async save(order: Order, tx?: PrismaTransactionClient, options?: { replaceChildren?: boolean }): Promise<string> {
    const client = tx ?? this.prisma.client;
    const { orderRow, deliveryRequestRow, itemRows, snapshotRows, snapshotComponentRows, splitRows } =
      OrderMapper.toPersistence(order);

    if (options?.replaceChildren) {
      const itemIds = itemRows.map((item) => item.id);
      const snapshotIds = snapshotRows.map((snapshot) => snapshot.id);
      const snapshotComponentIds = snapshotComponentRows.map((component) => component.id);
      const splitIds = splitRows.map((split) => split.id);

      const persistedOrder = await client.order.findUnique({
        where: { id: order.id },
        select: {
          items: {
            select: {
              id: true,
              bundleSnapshot: {
                select: {
                  id: true,
                  components: {
                    select: { id: true },
                  },
                },
              },
              ownerSplits: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (persistedOrder) {
        const staleItemIds = persistedOrder.items.map((item) => item.id).filter((id) => !itemIds.includes(id));
        const staleSnapshotIds = persistedOrder.items
          .flatMap((item) => (item.bundleSnapshot ? [item.bundleSnapshot.id] : []))
          .filter((id) => !snapshotIds.includes(id));
        const staleSnapshotComponentIds = persistedOrder.items
          .flatMap((item) => item.bundleSnapshot?.components.map((component) => component.id) ?? [])
          .filter((id) => !snapshotComponentIds.includes(id));
        const staleSplitIds = persistedOrder.items
          .flatMap((item) => item.ownerSplits.map((split) => split.id))
          .filter((id) => !splitIds.includes(id));

        if (staleSnapshotComponentIds.length > 0) {
          await client.bundleSnapshotComponent.deleteMany({
            where: {
              id: {
                in: staleSnapshotComponentIds,
              },
            },
          });
        }

        if (staleSnapshotIds.length > 0) {
          await client.bundleSnapshot.deleteMany({
            where: {
              id: {
                in: staleSnapshotIds,
              },
            },
          });
        }

        if (staleSplitIds.length > 0) {
          await client.orderItemOwnerSplit.deleteMany({
            where: {
              id: {
                in: staleSplitIds,
              },
            },
          });
        }

        if (staleItemIds.length > 0) {
          await client.orderItem.deleteMany({
            where: {
              id: {
                in: staleItemIds,
              },
            },
          });
        }
      }
    }

    await client.order.upsert({
      where: { id: orderRow.id },
      create: orderRow,
      update: orderRow,
    });

    if (deliveryRequestRow) {
      await client.orderDeliveryRequest.upsert({
        where: { orderId: deliveryRequestRow.orderId },
        create: deliveryRequestRow,
        update: deliveryRequestRow,
      });
    } else {
      await client.orderDeliveryRequest.deleteMany({
        where: { orderId: order.id },
      });
    }

    for (const item of itemRows) {
      await client.orderItem.upsert({
        where: { id: item.id },
        create: item,
        update: item,
      });
    }

    for (const snapshot of snapshotRows) {
      await client.bundleSnapshot.upsert({
        where: { id: snapshot.id },
        create: snapshot,
        update: snapshot,
      });
    }

    for (const component of snapshotComponentRows) {
      await client.bundleSnapshotComponent.upsert({
        where: { id: component.id },
        create: component,
        update: component,
      });
    }

    // status is explicitly included in update — splits transition from PENDING to VOID
    // when an item is removed or an order is cancelled
    for (const split of splitRows) {
      await client.orderItemOwnerSplit.upsert({
        where: { id: split.id },
        create: split,
        update: { status: split.status },
      });
    }

    return order.id;
  }
}
