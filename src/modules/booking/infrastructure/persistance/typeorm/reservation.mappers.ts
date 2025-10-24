import { Allocation } from "src/modules/booking/domain/models/allocation.model";
import { ReservationOrder } from "src/modules/booking/domain/models/reservation-order.model";
import { ReservationOrderItem } from "src/modules/booking/domain/models/reservation-order-item.model";
import { AllocationEntity } from "./allocation.entity";
import { ReservationOrderEntity } from "./reservation-order.entity";
import { ReservationOrderItemEntity } from "./reservation-order-item.entity";

export const reservationOrderMapper = {
	toDomain(entity: ReservationOrderEntity): ReservationOrder {
		return ReservationOrder.reconstitute(
			entity.id,
			entity.customer_id,
			entity.items?.map((item) => reservationOrderItemMapper.toDomain(item)) ??
				[],
			entity.status,
			entity.total_amount_cents,
			entity.created_at,
		);
	},

	toEntity(model: ReservationOrder): ReservationOrderEntity {
		const entity = new ReservationOrderEntity();
		entity.id = model.id;
		entity.customer_id = model.customerId;
		entity.status = model.status;
		entity.total_amount_cents = model.totalAmountCents;
		entity.created_at = model.createdAt;
		entity.updated_at = new Date();

		entity.items = model.items.map((item) =>
			reservationOrderItemMapper.toEntity(item),
		);

		return entity;
	},
};

export const reservationOrderItemMapper = {
	toDomain(entity: ReservationOrderItemEntity): ReservationOrderItem {
		return ReservationOrderItem.reconstitute(
			entity.id,
			entity.equipment_type_id,
			entity.quantity,
			entity.price_quote,
			entity.allocations?.map((a) => allocationMapper.toDomain(a)) ?? [],
		);
	},

	toEntity(model: ReservationOrderItem): ReservationOrderItemEntity {
		const entity = new ReservationOrderItemEntity();
		entity.id = model.id;
		entity.equipment_type_id = model.equipmentId;
		entity.quantity = model.quantity;
		entity.price_quote = model.priceQuote;
		entity.allocations = model.allocations.map((a) =>
			allocationMapper.toEntity(a),
		);
		return entity;
	},
};

export const allocationMapper = {
	toDomain(entity: AllocationEntity): Allocation {
		return Allocation.reconstitute(
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
