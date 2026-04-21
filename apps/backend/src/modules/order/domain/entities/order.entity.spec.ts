import { FulfillmentMethod, OrderStatus } from '@repo/types';

import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { OrderFinancialSnapshot } from '../value-objects/order-financial-snapshot.value-object';
import { OrderDeliveryRequest } from '../value-objects/order-delivery-request.value-object';

import { Order } from './order.entity';
import { InvalidOrderStatusTransitionException } from '../exceptions/order.exceptions';

function makeOrder(status: OrderStatus = OrderStatus.PENDING_REVIEW): Order {
  return Order.create({
    tenantId: 'tenant-1',
    locationId: 'location-1',
    currency: 'ARS',
    customerId: 'customer-1',
    period: DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T10:00:00.000Z')),
    status,
    fulfillmentMethod: FulfillmentMethod.PICKUP,
    insuranceSelected: false,
    insuranceRatePercent: 0,
  });
}

function makeDeliveryRequest(): OrderDeliveryRequest {
  return OrderDeliveryRequest.create({
    recipientName: 'Jane Doe',
    phone: '+5491122334455',
    addressLine1: 'Av. Libertador 1234',
    city: 'Buenos Aires',
    stateRegion: 'Buenos Aires',
    postalCode: '1425',
    country: 'Argentina',
    instructions: 'Call before arrival',
  });
}

function makeReconstitutedOrder(status: OrderStatus = OrderStatus.PENDING_REVIEW): Order {
  return Order.reconstitute({
    id: 'order-1',
    tenantId: 'tenant-1',
    locationId: 'location-1',
    customerId: 'customer-1',
    period: DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T10:00:00.000Z')),
    status,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      deliveryRequest: null,
      insuranceSelected: false,
      financialSnapshot: OrderFinancialSnapshot.zero('ARS', false, 0),
      notes: null,
      items: [],
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

  it('reconstitutes existing orders with financial snapshot state', () => {
    const order = makeReconstitutedOrder();

    expect(order.currentFinancialSnapshot.total.toString()).toBe('0');
    expect(order.currentInsuranceSelected).toBe(false);
  });

  it('stores delivery request only for delivery fulfillment', () => {
    const order = Order.create({
      tenantId: 'tenant-1',
      locationId: 'location-1',
      currency: 'ARS',
      customerId: 'customer-1',
      period: DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T10:00:00.000Z')),
      status: OrderStatus.PENDING_REVIEW,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryRequest: makeDeliveryRequest(),
      insuranceSelected: false,
      insuranceRatePercent: 0,
    });

    expect(order.currentFulfillmentMethod).toBe(FulfillmentMethod.DELIVERY);
    expect(order.currentDeliveryRequest?.recipientName).toBe('Jane Doe');
  });
});
