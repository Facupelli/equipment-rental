import { Injectable } from '@nestjs/common';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderStatus } from '@repo/types';
import { OrderRepositoryPort, PrismaTransactionClient } from 'src/modules/order/domain/ports/order.repository.port';
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

    if (!raw) {
      return null;
    }

    return OrderMapper.toDomain(raw);
  }

  async save(order: Order, tx: PrismaTransactionClient): Promise<string> {
    const { orderRow, itemRows, snapshotRows, snapshotComponentRows } = OrderMapper.toPersistence(order);

    // Upsert order
    await tx.order.upsert({
      where: { id: orderRow.id },
      create: orderRow,
      update: orderRow,
    });

    // Upsert items
    for (const item of itemRows) {
      await tx.orderItem.upsert({
        where: { id: item.id },
        create: item,
        update: item,
      });
    }

    // Upsert bundle snapshots and their components
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

    return order.id;
  }
}
