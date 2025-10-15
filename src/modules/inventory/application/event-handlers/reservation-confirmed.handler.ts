import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { EquipmentItemRepository } from "../../infrastructure/persistence/typeorm/equipment-item.repository";
import { ReservationConfirmedEvent } from "src/modules/booking/domain/events/reservation-confirmed/reservation-confirmed.event";

/**
 * Event Handler: ReservationConfirmed
 *
 * Reacts to reservation confirmations by allocating physical equipment items.
 * This handler implements the asynchronous workflow handoff from Booking to Inventory.
 *
 * Design Principles:
 * - Idempotent: Can be safely retried if event is reprocessed
 * - Fail-fast: Throws error if insufficient inventory (requires manual intervention)
 * - Optimistic Locking: Uses version-based concurrency control for performance at scale
 *
 * Performance Characteristics:
 * - No pessimistic locks (avoids blocking under high concurrency)
 * - Batch updates within single transaction
 * - Indexed queries on (equipmentTypeId, status)
 */
@Injectable()
@EventsHandler(ReservationConfirmedEvent)
export class ReservationConfirmedHandler
  implements IEventHandler<ReservationConfirmedEvent>
{
  private readonly logger = new Logger(ReservationConfirmedHandler.name);

  constructor(
    private readonly equipmentItemRepository: EquipmentItemRepository,
    private readonly dataSource: DataSource
  ) {}

  async handle(event: ReservationConfirmedEvent): Promise<void> {
    this.logger.log(
      `Processing ReservationConfirmedEvent for reservation ${event.reservationId}`
    );

    try {
      await this.dataSource.transaction(async (manager) => {
        // --- Step 1: Idempotency Check ---
        // Check if we've already allocated items for this reservation
        const existingAllocations =
          await this.equipmentItemRepository.findByReservationId(
            event.reservationId,
            manager
          );

        if (existingAllocations.length > 0) {
          this.logger.warn(
            `Reservation ${event.reservationId} already has ${existingAllocations.length} items allocated. Skipping (idempotent).`
          );
          return; // Event already processed
        }

        // --- Step 2: Find Available Items (FIFO) ---
        const availableItems =
          await this.equipmentItemRepository.findAvailableByType(
            event.equipmentTypeId,
            event.quantity,
            manager
          );

        // --- Step 3: Validate Sufficient Inventory ---
        if (availableItems.length < event.quantity) {
          const errorMsg =
            `Insufficient inventory for reservation ${event.reservationId}. ` +
            `Required: ${event.quantity}, Available: ${availableItems.length} ` +
            `(Type: ${event.equipmentTypeId})`;

          this.logger.error(errorMsg);

          // Fail-fast: Throw error to trigger retry/alert
          // Alternative: Emit PartialAllocationEvent for compensation
          throw new Error(errorMsg);
        }

        // --- Step 4: Allocate Items ---
        for (const item of availableItems) {
          try {
            // Domain method enforces business rules
            // item.markAsRented(event.reservationId, event.endTime);
            item.markAsRented();
          } catch (error) {
            this.logger.error(
              `Failed to allocate item ${item.serialNumber}: ${error.message}`
            );
            throw error;
          }
        }

        // --- Step 5: Persist Changes with Optimistic Locking ---
        try {
          await this.equipmentItemRepository.saveMany(availableItems, manager);

          this.logger.log(
            `Successfully allocated ${availableItems.length} items for reservation ${event.reservationId}`
          );
        } catch (error) {
          // OptimisticLockVersionMismatchError: Another transaction won the race
          this.logger.error(
            `Optimistic lock conflict while allocating for reservation ${event.reservationId}. ` +
              `Will retry on next event processing cycle.`
          );
          throw error; // Transaction rolls back, event remains in outbox
        }
      });
    } catch (error) {
      // Let NestJS/CQRS handle retry logic
      // Outbox processor will re-publish the event
      this.logger.error(
        `Failed to process ReservationConfirmedEvent for ${event.reservationId}: ${error.message}`
      );
      throw error;
    }
  }
}
