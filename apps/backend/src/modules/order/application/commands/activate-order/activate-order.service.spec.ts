import { FulfillmentMethod, OrderStatus } from '@repo/types';

import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

import { ActivateOrderCommand } from './activate-order.command';
import { ActivateOrderService } from './activate-order.service';
import { Order } from '../../../domain/entities/order.entity';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';
import { OrderRepository } from '../../../infrastructure/persistence/repositories/order.repository';

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

describe('ActivateOrderService', () => {
  it('activates a confirmed order', async () => {
    const order = makeOrder(OrderStatus.CONFIRMED);
    const orderRepository = {
      load: jest.fn(async () => order),
      save: jest.fn(async () => order.id),
    } as unknown as OrderRepository;

    const service = new ActivateOrderService(orderRepository);
    const result = await service.execute(new ActivateOrderCommand('tenant-1', order.id));

    expect(result.isOk()).toBe(true);
    expect(order.currentStatus).toBe(OrderStatus.ACTIVE);
    expect(orderRepository.save).toHaveBeenCalledWith(order);
  });

  it('returns not found when the order does not exist', async () => {
    const orderRepository = {
      load: jest.fn(async () => null),
      save: jest.fn(),
    } as unknown as OrderRepository;

    const service = new ActivateOrderService(orderRepository);
    const result = await service.execute(new ActivateOrderCommand('tenant-1', 'missing-order'));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(OrderNotFoundError);
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('returns invalid transition when the order is not confirmed', async () => {
    const order = makeOrder(OrderStatus.PENDING_REVIEW);
    const orderRepository = {
      load: jest.fn(async () => order),
      save: jest.fn(),
    } as unknown as OrderRepository;

    const service = new ActivateOrderService(orderRepository);
    const result = await service.execute(new ActivateOrderCommand('tenant-1', order.id));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(OrderStatusTransitionNotAllowedError);
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
