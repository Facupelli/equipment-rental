import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ReservationOrder } from "src/modules/booking/domain/models/reservation-order.model";
import type { Repository } from "typeorm";
import { ReservationOrderMapper } from "./reservation.mappers";
import { ReservationOrderEntity } from "./reservation-order.entity";

@Injectable()
export class ReservationOrderRepository {
	constructor(
    @InjectRepository(ReservationOrderEntity)
    private readonly repository: Repository<ReservationOrderEntity>
  ) {}

	async save(reservationOrder: ReservationOrder): Promise<void> {
		const schema = ReservationOrderMapper.toEntity(reservationOrder);
		await this.repository.save(schema);
	}

	async findById(id: string): Promise<ReservationOrder | null> {
		const schema = await this.repository.findOne({
			where: { id },
		});

		return schema ? ReservationOrderMapper.toDomain(schema) : null;
	}


}
