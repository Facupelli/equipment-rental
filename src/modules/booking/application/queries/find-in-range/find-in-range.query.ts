import type { IQuery } from "@nestjs/cqrs";
import type { ReservationOrderStatus } from "src/modules/booking/domain/models/reservation-order.model";

export class FindInRangeQuery implements IQuery {
	constructor(
		public readonly startDate: Date,
		public readonly endDate: Date,
		public readonly statuses: ReservationOrderStatus[],
	) {}
}
