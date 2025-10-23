import { Injectable, NotFoundException } from "@nestjs/common";
import type {
	ReservationOrder,
	ReservationOrderStatus,
} from "src/modules/booking/domain/models/reservation-order.model";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "src/shared/infrastructure/database/transaction-context";
import { BaseRepository } from "src/shared/infrastructure/persistence/base-repository";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { reservationOrderMapper } from "./reservation.mappers";
import { ReservationOrderEntity } from "./reservation-order.entity";

@Injectable()
export class ReservationOrderRepository extends BaseRepository<ReservationOrderEntity> {
	constructor(dataSource: DataSource, txContext: TransactionContext) {
		super(ReservationOrderEntity, dataSource, txContext);
	}

	async save(reservationOrder: ReservationOrder): Promise<void> {
		const schema = reservationOrderMapper.toEntity(reservationOrder);
		await this.managerRepo.save(schema);
	}

	async findById(id: string): Promise<ReservationOrder | null> {
		const schema = await this.managerRepo.findOne({
			where: { id },
		});

		return schema ? reservationOrderMapper.toDomain(schema) : null;
	}

	async getDetailById(id: string): Promise<ReservationOrder> {
		const order = await this.managerRepo
			.createQueryBuilder("order")
			.leftJoinAndSelect("order.items", "item")
			.leftJoinAndSelect("item.allocations", "allocation")
			.where("order.id = :id", { id })
			.getOne();

		if (!order) {
			throw new NotFoundException(`Reservation order with ID ${id} not found`);
		}

		return reservationOrderMapper.toDomain(order);
	}

	async findByCustomerId(
		customerId: string,
		options?: {
			status?: ReservationOrderStatus;
			includeCompleted?: boolean;
			fromDate?: Date;
			toDate?: Date;
			limit?: number;
			offset?: number;
		},
	): Promise<ReservationOrder[]> {
		const {
			status,
			includeCompleted = false,
			fromDate,
			toDate,
			limit,
			offset,
		} = options;

		const queryBuilder = this.managerRepo
			.createQueryBuilder("order")
			.where("order.customer_id = :customerId", { customerId });

		if (status) {
			queryBuilder.andWhere("order.status = :status", { status });
		}

		if (!includeCompleted) {
			queryBuilder.andWhere("order.status NOT IN (:...excludedStatuses)", {
				excludedStatuses: ["COMPLETED", "CANCELLED"],
			});
		}

		if (fromDate) {
			queryBuilder.andWhere("order.created_at >= :fromDate", { fromDate });
		}
		if (toDate) {
			queryBuilder.andWhere("order.created_at <= :toDate", { toDate });
		}

		queryBuilder.orderBy("order.created_at", "DESC");

		if (limit !== undefined) {
			queryBuilder.limit(limit);
		}
		if (offset !== undefined) {
			queryBuilder.offset(offset);
		}

		const entities = await queryBuilder.getMany();
		return entities.map((entity) => reservationOrderMapper.toDomain(entity));
	}
}
