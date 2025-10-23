import type { IQuery } from "@nestjs/cqrs";
import type { ReservationOrderStatus } from "src/modules/booking/domain/models/reservation-order.model";

export class GetCustomerBookingsQuery implements IQuery {
	constructor(
		public readonly customerId: string,
		public readonly status?: ReservationOrderStatus,
		public readonly includeCompleted?: boolean,
		public readonly fromDate?: Date,
		public readonly toDate?: Date,
		public readonly limit?: number,
		public readonly offset?: number,
	) {}
}
