import { DomainEvent } from './domain-event';

export abstract class DomainEventPublisher {
  abstract publish(events: DomainEvent[]): Promise<void>;
}
