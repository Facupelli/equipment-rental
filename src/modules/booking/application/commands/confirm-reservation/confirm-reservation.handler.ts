import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ConfirmReservationCommand } from "./confirm-reservation.command";
import { DataSource } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { OutboxSchema } from "src/modules/booking/infrastructure/persistance/outbox/outbox.schema";
import { ReservationRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation.repository";

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationHandler
  implements ICommandHandler<ConfirmReservationCommand, void>
{
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ConfirmReservationCommand): Promise<void> {
    const { reservationId } = command;

    // Find the reservation
    const reservation = await this.reservationRepository.findById(
      reservationId
    );
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    // Confirm the reservation (business rule enforced in entity)
    try {
      reservation.confirm();
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // Persist with outbox pattern (single transaction)
    await this.dataSource.transaction(async (manager) => {
      await this.reservationRepository.save(reservation);

      // Publish ReservationConfirmedEvent
      const outboxEntry = manager.create(OutboxSchema, {
        id: uuidv4(),
        eventType: "ReservationConfirmed",
        payload: JSON.stringify({
          reservationId: reservation.id,
          equipmentTypeId: reservation.equipmentTypeId,
          quantity: reservation.quantity,
          startDate: reservation.timeRange.start,
          endDate: reservation.timeRange.end,
          confirmedAt: new Date(),
        }),
        createdAt: new Date(),
        processedAt: null,
      });

      await manager.save(outboxEntry);
    });
  }
}
