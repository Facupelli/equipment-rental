import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppLogger } from 'src/core/logger/app-logger.service';
import { LogContext } from 'src/core/logger/log-context';

import { DomainEvent } from './domain-event';
import { DomainEventPublisher } from './domain-event.publisher';

@Injectable()
export class EventEmitterDomainEventPublisher extends DomainEventPublisher {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.eventEmitter.emitAsync(event.eventName, event);
        LogContext.increment('domainEventsPublished');

        const existingNames = LogContext.get('domainEventNames');
        const domainEventNames = Array.isArray(existingNames) ? existingNames : [];
        LogContext.set('domainEventNames', [...domainEventNames, event.eventName]);
      } catch (error) {
        LogContext.increment('domainEventPublishFailures');

        const tenant = event.tenantId ? ` tenant=${event.tenantId}` : '';
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `Failed to publish domain event ${event.eventName} eventId=${event.eventId} aggregate=${event.aggregateType}:${event.aggregateId}${tenant}`,
          stack,
          EventEmitterDomainEventPublisher.name,
        );

        throw error;
      }
    }
  }
}
