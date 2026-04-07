import { FulfillmentMethod, OrderAssignmentStage, OrderStatus } from '@repo/types';
import { ConfirmOrderService } from './confirm-order/confirm-order.service';
import { RejectOrderService } from './reject-order/reject-order.service';
import { CancelOrderService } from './cancel-order/cancel-order.service';
import { ExpireOrderService } from './expire-order/expire-order.service';
import { ConfirmOrderCommand } from './confirm-order/confirm-order.command';
import { RejectOrderCommand } from './reject-order/reject-order.command';
import { CancelOrderCommand } from './cancel-order/cancel-order.command';
import { ExpireOrderCommand } from './expire-order/expire-order.command';
import { OrderRepository } from '../../infrastructure/persistence/repositories/order.repository';
import { PrismaService } from 'src/core/database/prisma.service';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { Order } from '../../domain/entities/order.entity';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

function makeOrder(status: OrderStatus): Order {
  return Order.create({
    tenantId: 'tenant-1',
    locationId: 'location-1',
    currency: 'ARS',
    customerId: 'customer-1',
    period: DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T10:00:00.000Z')),
    status,
    fulfillmentMethod: FulfillmentMethod.PICKUP,
    insuranceSelected: false,
  });
}

function makeTransactionPrisma() {
  return {
    client: {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({ tx: true })),
    },
  } as unknown as PrismaService;
}

describe('Order assignment lifecycle services', () => {
  it('confirm converts hold assignments to committed assignments in the same transaction', async () => {
    const prisma = makeTransactionPrisma();
    const order = makeOrder(OrderStatus.PENDING_REVIEW);
    const orderRepository = {
      load: jest.fn(async () => order),
      save: jest.fn(async () => order.id),
    } as unknown as OrderRepository;
    const inventoryApi = {
      transitionOrderAssignmentsStage: jest.fn(async () => undefined),
    } as unknown as InventoryPublicApi;

    const service = new ConfirmOrderService(prisma, orderRepository, inventoryApi);
    const result = await service.execute(new ConfirmOrderCommand('tenant-1', order.id));

    expect(result.isOk()).toBe(true);
    expect(orderRepository.save).toHaveBeenCalled();
    expect(inventoryApi.transitionOrderAssignmentsStage).toHaveBeenCalledWith(
      order.id,
      OrderAssignmentStage.HOLD,
      OrderAssignmentStage.COMMITTED,
      { tx: true },
    );
  });

  it('reject releases hold assignments in the same transaction', async () => {
    const prisma = makeTransactionPrisma();
    const order = makeOrder(OrderStatus.PENDING_REVIEW);
    const orderRepository = {
      load: jest.fn(async () => order),
      save: jest.fn(async () => order.id),
    } as unknown as OrderRepository;
    const inventoryApi = {
      releaseOrderAssignments: jest.fn(async () => undefined),
    } as unknown as InventoryPublicApi;

    const service = new RejectOrderService(prisma, orderRepository, inventoryApi);
    const result = await service.execute(new RejectOrderCommand('tenant-1', order.id));

    expect(result.isOk()).toBe(true);
    expect(orderRepository.save).toHaveBeenCalled();
    expect(inventoryApi.releaseOrderAssignments).toHaveBeenCalledWith(order.id, OrderAssignmentStage.HOLD, {
      tx: true,
    });
  });

  it('expire releases hold assignments in the same transaction', async () => {
    const prisma = makeTransactionPrisma();
    const order = makeOrder(OrderStatus.PENDING_REVIEW);
    const orderRepository = {
      load: jest.fn(async () => order),
      save: jest.fn(async () => order.id),
    } as unknown as OrderRepository;
    const inventoryApi = {
      releaseOrderAssignments: jest.fn(async () => undefined),
    } as unknown as InventoryPublicApi;

    const service = new ExpireOrderService(prisma, orderRepository, inventoryApi);
    const result = await service.execute(new ExpireOrderCommand('tenant-1', order.id));

    expect(result.isOk()).toBe(true);
    expect(orderRepository.save).toHaveBeenCalled();
    expect(inventoryApi.releaseOrderAssignments).toHaveBeenCalledWith(order.id, OrderAssignmentStage.HOLD, {
      tx: true,
    });
  });

  it('cancel releases committed assignments in the same transaction', async () => {
    const prisma = makeTransactionPrisma();
    const order = makeOrder(OrderStatus.CONFIRMED);
    const orderRepository = {
      load: jest.fn(async () => order),
      save: jest.fn(async () => order.id),
    } as unknown as OrderRepository;
    const inventoryApi = {
      releaseOrderAssignments: jest.fn(async () => undefined),
    } as unknown as InventoryPublicApi;

    const service = new CancelOrderService(prisma, orderRepository, inventoryApi);
    const result = await service.execute(new CancelOrderCommand('tenant-1', order.id));

    expect(result.isOk()).toBe(true);
    expect(orderRepository.save).toHaveBeenCalled();
    expect(inventoryApi.releaseOrderAssignments).toHaveBeenCalledWith(order.id, OrderAssignmentStage.COMMITTED, {
      tx: true,
    });
  });
});
