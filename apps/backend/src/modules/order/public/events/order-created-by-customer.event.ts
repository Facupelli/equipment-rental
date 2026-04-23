import { randomUUID } from 'crypto';

import { FulfillmentMethod, OrderStatus } from '@repo/types';
import { DomainEvent } from 'src/core/domain/events/domain-event';

interface OrderCreatedByCustomerEventProps {
  orderId: string;
  tenantId: string;
  customerId: string;
  locationId: string;
  orderNumber: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  pickupDate: string;
  pickupTime: number;
  returnDate: string;
  returnTime: number;
  occurredAt?: Date;
}

export class OrderCreatedByCustomerEvent implements DomainEvent {
  static readonly EVENT_NAME = 'OrderCreatedByCustomerEvent';

  public readonly eventId = randomUUID();
  public readonly eventName = OrderCreatedByCustomerEvent.EVENT_NAME;
  public readonly aggregateId: string;
  public readonly aggregateType = 'Order';
  public readonly tenantId: string;
  public readonly customerId: string;
  public readonly locationId: string;
  public readonly orderNumber: number;
  public readonly status: OrderStatus;
  public readonly fulfillmentMethod: FulfillmentMethod;
  public readonly pickupDate: string;
  public readonly pickupTime: number;
  public readonly returnDate: string;
  public readonly returnTime: number;
  public readonly occurredAt: Date;

  constructor(props: OrderCreatedByCustomerEventProps) {
    this.aggregateId = props.orderId;
    this.tenantId = props.tenantId;
    this.customerId = props.customerId;
    this.locationId = props.locationId;
    this.orderNumber = props.orderNumber;
    this.status = props.status;
    this.fulfillmentMethod = props.fulfillmentMethod;
    this.pickupDate = props.pickupDate;
    this.pickupTime = props.pickupTime;
    this.returnDate = props.returnDate;
    this.returnTime = props.returnTime;
    this.occurredAt = props.occurredAt ?? new Date();
  }
}
