import { randomUUID } from 'crypto';

import { DomainEvent } from 'src/core/domain/events/domain-event';

interface TenantRegisteredEventProps {
  tenantId: string;
  slug: string;
  occurredAt?: Date;
}

export class TenantRegisteredEvent implements DomainEvent {
  static readonly EVENT_NAME = 'TenantRegisteredEvent';

  public readonly eventId = randomUUID();
  public readonly eventName = TenantRegisteredEvent.EVENT_NAME;
  public readonly aggregateId: string;
  public readonly aggregateType = 'Tenant';
  public readonly tenantId: string;
  public readonly slug: string;
  public readonly occurredAt: Date;

  constructor(props: TenantRegisteredEventProps) {
    this.aggregateId = props.tenantId;
    this.tenantId = props.tenantId;
    this.slug = props.slug;
    this.occurredAt = props.occurredAt ?? new Date();
  }
}
