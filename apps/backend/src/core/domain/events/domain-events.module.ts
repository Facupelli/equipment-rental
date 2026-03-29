import { Global, Module } from '@nestjs/common';

import { DomainEventPublisher } from './domain-event.publisher';
import { EventEmitterDomainEventPublisher } from './event-emitter-domain-event.publisher';

@Global()
@Module({
  providers: [
    EventEmitterDomainEventPublisher,
    {
      provide: DomainEventPublisher,
      useExisting: EventEmitterDomainEventPublisher,
    },
  ],
  exports: [DomainEventPublisher],
})
export class DomainEventsModule {}
