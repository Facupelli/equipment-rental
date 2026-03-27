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

  async save(order: Order, tx: PrismaTransactionClient): Promise<string> {
    const { orderRow, itemRows, snapshotRows, snapshotComponentRows, splitRows } = OrderMapper.toPersistence(order);

    await tx.order.upsert({
      where: { id: orderRow.id },
      create: orderRow,
      update: orderRow,
    });

    for (const item of itemRows) {
      await tx.orderItem.upsert({
        where: { id: item.id },
        create: item,
        update: item,
      });
    }

    for (const snapshot of snapshotRows) {
      await tx.bundleSnapshot.upsert({
        where: { id: snapshot.id },
        create: snapshot,
        update: snapshot,
      });
    }

    for (const component of snapshotComponentRows) {
      await tx.bundleSnapshotComponent.upsert({
        where: { id: component.id },
        create: component,
        update: component,
      });
    }

    // status is explicitly included in update — splits transition from PENDING to VOID
    // when an item is removed or an order is cancelled
    for (const split of splitRows) {
      await tx.orderItemOwnerSplit.upsert({
        where: { id: split.id },
        create: split,
        update: { status: split.status },
      });
    }

    return order.id;
  }
}
