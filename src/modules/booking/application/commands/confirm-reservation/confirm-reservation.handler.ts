import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ConfirmReservationCommand } from "./confirm-reservation.command";
import { DataSource } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { OutboxSchema } from "src/modules/booking/infrastructure/persistance/outbox/outbox.schema";
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationHandler
  implements ICommandHandler<ConfirmReservationCommand, void>
{
  constructor(
    private readonly reservationOrderRepository: ReservationOrderRepository,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ConfirmReservationCommand): Promise<void> {
    const { reservationId } = command;

    // Find the reservation
    const reservationOrder = await this.reservationOrderRepository.findById(
      reservationId
    );
    if (!reservationOrder) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    // Confirm the reservation (business rule enforced in entity)
    try {
      reservationOrder.confirm();
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // Persist with outbox pattern (single transaction)
    await this.dataSource.transaction(async (manager) => {
      await this.reservationOrderRepository.save(reservationOrder);

      // Publish ReservationConfirmedEvent
      const outboxEntry = manager.create(OutboxSchema, {
        id: uuidv4(),
        eventType: "ReservationConfirmed",
        payload: JSON.stringify({
          reservationId: reservationOrder.id,
          startDate: reservationOrder.startDatetime,
          endDate: reservationOrder.endDatetime,
          confirmedAt: new Date(),
        }),
        createdAt: new Date(),
        processedAt: null,
      });

      await manager.save(outboxEntry);
    });
  }
}
