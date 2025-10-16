import { Injectable } from "@nestjs/common";
import type { ReservationOrder } from "src/modules/booking/domain/models/reservation-order.model";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "src/shared/infrastructure/database/transaction-context";
import { BaseRepository } from "src/shared/infrastructure/persistence/base-repository";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { ReservationOrderMapper } from "./reservation.mappers";
import { ReservationOrderEntity } from "./reservation-order.entity";

@Injectable()
export class ReservationOrderRepository extends BaseRepository<ReservationOrderEntity> {
	constructor(dataSource: DataSource, txContext: TransactionContext) {
		super(ReservationOrderEntity, dataSource, txContext);
	}

	async save(reservationOrder: ReservationOrder): Promise<void> {
		const schema = ReservationOrderMapper.toEntity(reservationOrder);
		await this.managerRepo.save(schema);
	}

	async findById(id: string): Promise<ReservationOrder | null> {
		const schema = await this.managerRepo.findOne({
			where: { id },
		});

		return schema ? ReservationOrderMapper.toDomain(schema) : null;
	}
}
