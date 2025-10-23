import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { ReservationOrder } from "src/modules/booking/domain/models/reservation-order.model";
// biome-ignore lint: /style/useImportType
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
import { GetDetailByIdQuery } from "./get-detail-by-id.query";

@QueryHandler(GetDetailByIdQuery)
export class GetDetailByIdHandler implements IQueryHandler<GetDetailByIdQuery> {
	constructor(
		private readonly reservationOrderRepository: ReservationOrderRepository,
	) {}

	async execute(query: GetDetailByIdQuery): Promise<ReservationOrder> {
		const orders = await this.reservationOrderRepository.getDetailById(
			query.orderId,
		);

		return orders;
	}
}
