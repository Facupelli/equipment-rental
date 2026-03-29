import { AggregateRootBase } from '../aggregate-root.base';
import { DomainEvent } from './domain-event';

export interface DomainEventsCollector {
  collect(events: DomainEvent[]): void;
  collectFrom(aggregate: AggregateRootBase): void;
  drain(): DomainEvent[];
}
