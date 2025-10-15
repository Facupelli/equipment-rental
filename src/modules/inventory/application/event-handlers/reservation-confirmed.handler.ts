import { Injectable, Logger } from "@nestjs/common";
import { EventsHandler, type IEventHandler } from "@nestjs/cqrs";
import { ReservationConfirmedEvent } from "src/modules/booking/domain/events/reservation-confirmed/reservation-confirmed.event";

@Injectable()
@EventsHandler(ReservationConfirmedEvent)
export class ReservationConfirmedHandler
	implements IEventHandler<ReservationConfirmedEvent>
{
	private readonly logger = new Logger(ReservationConfirmedHandler.name);

	async handle(event: ReservationConfirmedEvent): Promise<void> {
		this.logger.log(
			`Processing ReservationConfirmedEvent for reservation ${event.reservationId}`,
		);
	}
}
