export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly tenantId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly version?: number;
}
