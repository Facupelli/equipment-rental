import { Allocation } from "src/modules/booking/domain/models/allocation.model";
import { ReservationOrder } from "src/modules/booking/domain/models/reservation-order.model";
import { ReservationOrderItem } from "src/modules/booking/domain/models/reservation-order-item.model";
import { AllocationEntity } from "./allocation.entity";
import { ReservationOrderEntity } from "./reservation-order.entity";
import { ReservationOrderItemEntity } from "./reservation-order-item.entity";

export const ReservationOrderMapper = {
	toDomain(entity: ReservationOrderEntity): ReservationOrder {
		return new ReservationOrder(
			entity.id,
			entity.customer_id,
			entity.items?.map((item) => ReservationOrderItemMapper.toDomain(item)) ??
				[],
			entity.status,
			entity.created_at,
		);
	},

	toEntity(model: ReservationOrder): ReservationOrderEntity {
		const entity = new ReservationOrderEntity();
		entity.id = model.id;
		entity.customer_id = model.customerId;
		entity.status = model.status;
		entity.created_at = model.createdAt;
		entity.updated_at = new Date();

		entity.items = model.items.map((item) =>
			ReservationOrderItemMapper.toEntity(item),
		);

		return entity;
	},
};

export const ReservationOrderItemMapper = {
	toDomain(entity: ReservationOrderItemEntity): ReservationOrderItem {
		return new ReservationOrderItem(
			entity.id,
			entity.equipment_type_id,
			entity.quantity,
			entity.allocations?.map((a) => AllocationMapper.toDomain(a)) ?? [],
		);
	},

	toEntity(model: ReservationOrderItem): ReservationOrderItemEntity {
		const entity = new ReservationOrderItemEntity();
		entity.id = model.id;
		entity.equipment_type_id = model.equipmentId;
		entity.quantity = model.quantity;
		entity.allocations = model.allocations.map((a) =>
			AllocationMapper.toEntity(a),
		);
		return entity;
	},
};

export const AllocationMapper = {
	toDomain(entity: AllocationEntity): Allocation {
		return new Allocation(
			entity.id,
			entity.item_id,
			entity.start_date,
			entity.end_date,
		);
	},

	toEntity(model: Allocation): AllocationEntity {
		const entity = new AllocationEntity();
		entity.id = model.id;
		entity.item_id = model.equipmentUnitId;
		entity.start_date = model.startDate;
		entity.end_date = model.endDate;
		return entity;
	},
};
