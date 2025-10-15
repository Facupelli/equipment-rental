import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { CreateReservationCommand } from "./create-reservation.command";
import { AvailabilityCheckerService } from "../../../domain/services/availability-checker.service";
import { OutboxRepository } from "src/modules/booking/infrastructure/persistance/outbox/outbox.repository";
import { DataSource } from "typeorm";
import { InventoryFacade } from "src/modules/inventory/inventory.facade";
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
import { validateDateRange } from "src/shared/utils/date-range.utils";
import {
  ReservationOrder,
  ReservationOrderStatus,
} from "src/modules/booking/domain/models/reservation-order.model";
import { v4 as uuidv4 } from "uuid";

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
    private readonly reservationOrderRepository: ReservationOrderRepository,
    private readonly availabilityChecker: AvailabilityCheckerService,
    private readonly outboxRepository: OutboxRepository,
    private readonly dataSource: DataSource, // For transactions // In real implementation, inject InventoryFacade to get total inventory // For now, we'll hardcode for demonstration
    private readonly inventoryFacade: InventoryFacade
  ) {}

  async execute(command: CreateReservationCommand): Promise<string> {
    // 1. Create time range value object
    try {
      validateDateRange(command.startDateTime, command.endDateTime);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 2. Check availability (domain service)
    const totalInventory = await this.inventoryFacade.getTotalCapacity(
      command.equipmentTypeId
    );

    const isAvailable = await this.availabilityChecker.checkAvailability({
      equipmentTypeId: command.equipmentTypeId,
      startDateTime: command.startDateTime,
      endDateTime: command.endDateTime,
      quantity: command.quantity,
      totalInventory,
      // TODO
      bufferDays: 0,
    });

    if (!isAvailable) {
      throw new ConflictException(
        "Equipment not available for the requested time range"
      );
    }

    // 3. Create reservation entity (domain logic)
    const reservationOrder = new ReservationOrder(
      uuidv4(),
      command.customerId,
      [],
      ReservationOrderStatus.Pending,
      new Date()
    );

    // 4. Save reservation + outbox message in SINGLE TRANSACTION
    // This is the key to the outbox pattern!
    await this.dataSource.transaction(async (manager) => {
      // Save reservation
      await this.reservationOrderRepository.save(reservationOrder);

      // Add event to outbox (same transaction!)
      await this.outboxRepository.save("ReservationCreated", {
        reservationId: reservationOrder.id,
        customerId: reservationOrder.customerId,
      });
    });

    // Background worker will process the outbox and publish events
    // Other modules will react asynchronously!

    return reservationOrder.id;
  }
}
