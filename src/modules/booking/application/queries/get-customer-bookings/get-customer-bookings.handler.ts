import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { ReservationOrder } from "src/modules/booking/domain/models/reservation-order.model";
// biome-ignore lint: /style/useImportType
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
import { GetCustomerBookingsQuery } from "./get-customer-bookings.query";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

@QueryHandler(GetCustomerBookingsQuery)
export class GetCustomerBookingsHandler
	implements IQueryHandler<GetCustomerBookingsQuery>
{
	constructor(
		private readonly reservationOrderRepository: ReservationOrderRepository,
	) {}

	async execute(query: GetCustomerBookingsQuery): Promise<ReservationOrder[]> {
		const orders = await this.reservationOrderRepository.findByCustomerId(
			query.customerId,
			{
				status: query.status,
				includeCompleted: query.includeCompleted ?? false,
				limit: query.limit ?? DEFAULT_LIMIT,
				offset: query.offset ?? DEFAULT_OFFSET,
				fromDate: query.fromDate,
				toDate: query.toDate,
			},
		);

		return orders;
	}
}
