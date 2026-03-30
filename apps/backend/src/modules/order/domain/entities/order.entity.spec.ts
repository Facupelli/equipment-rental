import { OrderStatus } from '@repo/types';

import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

import { Order } from './order.entity';
import { InvalidOrderStatusTransitionException } from '../exceptions/order.exceptions';

function makeOrder(status: OrderStatus = OrderStatus.PENDING_REVIEW): Order {
  return Order.create({
    tenantId: 'tenant-1',
    locationId: 'location-1',
    customerId: 'customer-1',
    period: DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T10:00:00.000Z')),
    status,
  });
}

describe('Order', () => {
  it('confirms a pending review order', () => {
    const order = makeOrder();

    order.confirm();

    expect(order.currentStatus).toBe(OrderStatus.CONFIRMED);
  });

  it('rejects a pending review order', () => {
    const order = makeOrder();

    order.reject();

    expect(order.currentStatus).toBe(OrderStatus.REJECTED);
  });

  it('expires a pending review order', () => {
    const order = makeOrder();

    order.expire();

    expect(order.currentStatus).toBe(OrderStatus.EXPIRED);
  });

  it('cancels only confirmed orders', () => {
    const order = makeOrder(OrderStatus.CONFIRMED);

    order.cancel();

    expect(order.currentStatus).toBe(OrderStatus.CANCELLED);
  });

  it('activates and completes a confirmed order', () => {
    const order = makeOrder(OrderStatus.CONFIRMED);

    order.activate();
    order.complete();

    expect(order.currentStatus).toBe(OrderStatus.COMPLETED);
  });

  it('rejects invalid transitions', () => {
    const order = makeOrder(OrderStatus.CONFIRMED);

    expect(() => order.reject()).toThrow(InvalidOrderStatusTransitionException);
    expect(() => order.expire()).toThrow(InvalidOrderStatusTransitionException);
  });
});
