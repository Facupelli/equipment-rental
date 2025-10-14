import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, BadRequestException, ConflictException } from "@nestjs/common";
import { CreateReservationCommand } from "./create-reservation.command";
import {
  IReservationRepository,
  RESERVATION_REPOSITORY,
} from "../../../domain/repositories/reservation.repository.interface";
import { Reservation } from "../../../domain/entities/reservation.entity";
import { TimeRange } from "../../../domain/value-objects/time-range.vo";
import { AvailabilityCheckerService } from "../../../domain/services/availability-checker.service";
import { ReservationCreatedEvent } from "../../../domain/events/reservation-created.event";
import { Result } from "../../../../../shared/domain/result";
import { OutboxRepository } from "src/modules/booking/infrastructure/persistance/outbox/outbox.repository";
import { DataSource } from "typeorm";
import { ReservationRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation.repository";
import { InventoryFacade } from "src/modules/inventory/inventory.facade";

/**
 * Create Reservation Command Handler (Use Case)
 *
 * Orchestrates:
 * 1. Availability check (via domain service)
 * 2. Reservation creation (domain entity)
 * 3. Persistence (via repository)
 * 4. Event publishing (for other modules to react)
 */
@CommandHandler(CreateReservationCommand)
export class CreateReservationHandler
  implements ICommandHandler<CreateReservationCommand, string>
{
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly availabilityChecker: AvailabilityCheckerService,
    private readonly outboxRepository: OutboxRepository,
    private readonly dataSource: DataSource, // For transactions // In real implementation, inject InventoryFacade to get total inventory // For now, we'll hardcode for demonstration
    private readonly inventoryFacade: InventoryFacade
  ) {}

  async execute(command: CreateReservationCommand): Promise<string> {
    // 1. Create time range value object
    const timeRangeResult = TimeRange.create(
      command.startDateTime,
      command.endDateTime
    );

    if (timeRangeResult.isFailure) {
      throw new BadRequestException(timeRangeResult.error);
    }

    const timeRange = timeRangeResult.value;

    // 2. Check availability (domain service)
    const totalInventory = await this.inventoryFacade.getTotalCapacity(
      command.equipmentTypeId
    );

    const isAvailable = await this.availabilityChecker.checkAvailability({
      equipmentTypeId: command.equipmentTypeId,
      timeRange,
      quantity: command.quantity,
      totalInventory,
    });

    if (!isAvailable) {
      throw new ConflictException(
        "Equipment not available for the requested time range"
      );
    }

    // 3. Create reservation entity (domain logic)
    const reservationResult = Reservation.create({
      customerId: command.customerId,
      equipmentTypeId: command.equipmentTypeId,
      timeRange,
      quantity: command.quantity,
      status: "pending" as any, // Will be enum
      notes: command.notes,
    });

    if (reservationResult.isFailure) {
      throw new BadRequestException(reservationResult.error);
    }

    const reservation = reservationResult.value;

    // 4. Save reservation + outbox message in SINGLE TRANSACTION
    // This is the key to the outbox pattern!
    await this.dataSource.transaction(async (manager) => {
      // Save reservation
      await this.reservationRepository.save(reservation);

      // Add event to outbox (same transaction!)
      await this.outboxRepository.save("ReservationCreated", {
        reservationId: reservation.id.value,
        customerId: reservation.customerId,
        equipmentTypeId: reservation.equipmentTypeId,
        startDateTime: reservation.startDateTime.toISOString(),
        endDateTime: reservation.endDateTime.toISOString(),
        quantity: reservation.quantity,
      });
    });

    // Background worker will process the outbox and publish events
    // Other modules will react asynchronously!

    return reservation.id.value;
  }
}
