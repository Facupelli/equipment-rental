import { AggregateRootBase } from '../aggregate-root.base';
import { DomainEvent } from './domain-event';
import { DomainEventsCollector } from './domain-events.collector';

export class InMemoryDomainEventsCollector implements DomainEventsCollector {
  private readonly events: DomainEvent[] = [];

  collect(events: DomainEvent[]): void {
    this.events.push(...events);
  }

  collectFrom(aggregate: AggregateRootBase): void {
    this.collect(aggregate.pullDomainEvents());
  }

  drain(): DomainEvent[] {
    const drained = [...this.events];
    this.events.length = 0;
    return drained;
  }
}
