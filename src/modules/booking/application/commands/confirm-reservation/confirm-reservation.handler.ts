import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { OutboxSchema } from "src/modules/booking/infrastructure/persistance/outbox/outbox.schema";
// biome-ignore lint: /style/useImportType
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ConfirmReservationCommand } from "./confirm-reservation.command";

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationHandler
	implements ICommandHandler<ConfirmReservationCommand, void>
{
	constructor(
		private readonly reservationOrderRepository: ReservationOrderRepository,
		private readonly dataSource: DataSource,
	) {}

	async execute(command: ConfirmReservationCommand): Promise<void> {
		const { reservationId } = command;

		const reservationOrder =
			await this.reservationOrderRepository.findById(reservationId);

		if (!reservationOrder) {
			throw new NotFoundException(`Reservation ${reservationId} not found`);
		}

		try {
			reservationOrder.confirm();
		} catch (error) {
			throw new BadRequestException(error.message);
		}

		await this.dataSource.transaction(async (manager) => {
			await this.reservationOrderRepository.save(reservationOrder);

			const outboxEntry = manager.create(OutboxSchema, {
				id: uuidv4(),
				eventType: "ReservationConfirmed",
				payload: JSON.stringify({
					reservationId: reservationOrder.id,
					confirmedAt: new Date(),
				}),
				createdAt: new Date(),
				processedAt: null,
			});

			await manager.save(outboxEntry);
		});
	}
}
