import { Injectable, Logger } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { OutboxRepository } from "../persistance/outbox/outbox.repository";
import { ReservationCreatedEvent } from "../../domain/events/reservation-created.event";

/**
 * Outbox Processor (Background Job)
 *
 * Runs periodically to process pending outbox messages
 * This is our "async seed" - later can be replaced with Kafka consumer
 */
@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Process outbox every 5 seconds
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    const pendingEvents = await this.outboxRepository.getPendingEvents();

    if (pendingEvents.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingEvents.length} outbox events`);

    for (const outboxEvent of pendingEvents) {
      try {
        // Reconstruct domain event from outbox
        const domainEvent = this.toDomainEvent(
          outboxEvent.event_type,
          outboxEvent.payload
        );

        // Publish to event bus (other modules will react)
        this.eventBus.publish(domainEvent);

        // Mark as completed
        await this.outboxRepository.markCompleted(outboxEvent.id);

        this.logger.debug(`Processed event: ${outboxEvent.event_type}`);
      } catch (error) {
        this.logger.error(
          `Failed to process event ${outboxEvent.id}: ${error.message}`
        );
        await this.outboxRepository.markFailed(outboxEvent.id, error.message);
      }
    }
  }

  /**
   * Map outbox event to domain event
   */
  private toDomainEvent(eventType: string, payload: any): any {
    switch (eventType) {
      case "ReservationCreated":
        return new ReservationCreatedEvent(
          payload.reservationId,
          payload.customerId,
          payload.equipmentTypeId,
          new Date(payload.startDateTime),
          new Date(payload.endDateTime),
          payload.quantity
        );

      // case "ReservationConfirmed":
      //   return new ReservationConfirmedEvent(
      //     payload.reservationId,
      //     payload.customerId,
      //     payload.equipmentTypeId,
      //     new Date(payload.startDateTime),
      //     new Date(payload.endDateTime),
      //     payload.quantity,
      //     payload.quotedPrice
      //   );

      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
}
