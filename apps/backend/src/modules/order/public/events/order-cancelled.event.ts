import { randomUUID } from 'crypto';

import { DomainEvent } from 'src/core/domain/events/domain-event';

interface OrderCancelledEventProps {
  orderId: string;
  tenantId: string;
  customerId: string | null;
  occurredAt?: Date;
}

export class OrderCancelledEvent implements DomainEvent {
  static readonly EVENT_NAME = 'OrderCancelledEvent';

  public readonly eventId = randomUUID();
  public readonly eventName = OrderCancelledEvent.EVENT_NAME;
  public readonly aggregateId: string;
  public readonly aggregateType = 'Order';
  public readonly tenantId: string;
  public readonly customerId: string | null;
  public readonly occurredAt: Date;

  constructor(props: OrderCancelledEventProps) {
    this.aggregateId = props.orderId;
    this.tenantId = props.tenantId;
    this.customerId = props.customerId;
    this.occurredAt = props.occurredAt ?? new Date();
  }
}
