// biome-ignore lint:reason
import { EquipmentItemEntity } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.entity";
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
// biome-ignore lint:reason
import { ReservationOrderItemEntity } from "./reservation-order-item.entity";

@Entity({ schema: "booking", name: "allocations" })
@Index(["item_id", "start_date", "end_date"])
export class AllocationEntity {
	@PrimaryGeneratedColumn("uuid", { name: "allocation_id" })
	id: string;

	@ManyToOne(
		"ReservationOrderItemEntity",
		(item: ReservationOrderItemEntity) => item.allocations,
		{
			onDelete: "CASCADE",
		},
	)
	order_item: ReservationOrderItemEntity;

	@Column({ type: "uuid", name: "item_id" })
	item_id: string;

	@Column({ type: "date", name: "start_date" })
	start_date: Date;

	@Column({ type: "date", name: "end_date" })
	end_date: Date;

	@ManyToOne(
		"EquipmentItemEntity",
		(item: EquipmentItemEntity) => item.allocations,
	)
	equipment_item: EquipmentItemEntity;
}
