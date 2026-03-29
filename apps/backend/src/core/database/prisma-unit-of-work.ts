import { Injectable } from '@nestjs/common';

import { DomainEventsCollector } from '../domain/events/domain-events.collector';
import { DomainEventPublisher } from '../domain/events/domain-event.publisher';
import { InMemoryDomainEventsCollector } from '../domain/events/in-memory-domain-events.collector';

import { PrismaService } from './prisma.service';

export type PrismaTransactionClient = Parameters<PrismaService['client']['$transaction']>[0] extends (
  tx: infer T,
  ...args: never[]
) => Promise<unknown>
  ? T
  : never;

export interface PrismaTransactionContext {
  tx: PrismaTransactionClient;
  events: DomainEventsCollector;
}

@Injectable()
export class PrismaUnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async runInTransaction<T>(work: (context: PrismaTransactionContext) => Promise<T>): Promise<T> {
    const events = new InMemoryDomainEventsCollector();

    const result = await this.prisma.client.$transaction(async (tx) => {
      return work({ tx, events });
    });

    const recordedEvents = events.drain();
    if (recordedEvents.length === 0) {
      return result;
    }

    try {
      await this.domainEventPublisher.publish(recordedEvents);
    } catch {}

    return result;
  }
}
