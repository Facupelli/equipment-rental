import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ReservationOrderItem } from "src/modules/booking/domain/models/reservation-order-item.model";
import type { Repository } from "typeorm";
import { ReservationOrderItemMapper } from "./reservation.mappers";
import { ReservationOrderItemEntity } from "./reservation-order-item.entity";

@Injectable()
export class ReservationOrderItemRepository {
	constructor(
    @InjectRepository(ReservationOrderItemEntity)
    private readonly repository: Repository<ReservationOrderItemEntity>
  ) {}

	async save(reservationOrderItem: ReservationOrderItem): Promise<void> {
		const entity = ReservationOrderItemMapper.toEntity(reservationOrderItem);
		await this.repository.save(entity);
	}
}
