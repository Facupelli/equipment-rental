import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
import type { FindInRangeResponseDTO } from "./find-in-range.dto";
import { FindInRangeQuery } from "./find-in-range.query";

@QueryHandler(FindInRangeQuery)
export class FindInRangeHanlder
	implements IQueryHandler<FindInRangeQuery, FindInRangeResponseDTO[]>
{
	constructor(
		private readonly reservationOrderRepository: ReservationOrderRepository,
	) {}

	async execute(query: FindInRangeQuery): Promise<FindInRangeResponseDTO[]> {
		const { startDate, endDate, statuses } = query;

		const bookings = await this.reservationOrderRepository.findInRange({
			rangeStart: startDate,
			rangeEnd: endDate,
			statuses,
		});

		return bookings;
	}
}
