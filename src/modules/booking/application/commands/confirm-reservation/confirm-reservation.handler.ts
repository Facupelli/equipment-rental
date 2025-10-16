import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
// biome-ignore lint: /style/useImportType
import { OutboxService } from "src/modules/outbox/application/outbox.service";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { ConfirmReservationCommand } from "./confirm-reservation.command";

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationHandler
	implements ICommandHandler<ConfirmReservationCommand, void>
{
	constructor(
		private readonly reservationOrderRepository: ReservationOrderRepository,
		private readonly dataSource: DataSource,
		private readonly outboxService: OutboxService,
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

			await this.outboxService.saveEvent("ReservationConfirmed", {
				reservationId: reservationOrder.id,
				confirmedAt: new Date(),
			});
		});
	}
}
