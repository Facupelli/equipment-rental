import { DomainEvent } from './events/domain-event';

export abstract class AggregateRootBase {
  private readonly domainEvents: DomainEvent[] = [];

  protected recordDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
