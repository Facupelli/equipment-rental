import type { ReservationOrderStatus } from "src/modules/booking/domain/models/reservation-order.model";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import type { ReservationOrderItemEntity } from "./reservation-order-item.entity";

@Entity({ schema: "booking", name: "reservation_order" })
@Index(["customer_id"])
@Index(["status"])
export class ReservationOrderEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column("varchar")
	customer_id: string;

	@Column("varchar", { length: 20 })
	status: ReservationOrderStatus;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;

	@OneToMany(
		"ReservationOrderItemEntity",
		(item: ReservationOrderItemEntity) => item.order,
		{
			cascade: ["insert", "update"],
		},
	)
	items: ReservationOrderItemEntity[];
}
