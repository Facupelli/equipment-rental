import type { ReservationOrderStatus } from "src/modules/booking/domain/entities/reservation-order.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import type { ReservationOrderItemSchema } from "./reservation-order-item.schema";

@Entity({ schema: "booking", name: "reservation_order" })
@Index(["customer_id"])
@Index(["start_datetime", "end_datetime"])
export class ReservationOrderSchema {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  customer_id: string;

  @Column("varchar", { length: 20 })
  status: ReservationOrderStatus;

  @Column("timestamp")
  start_datetime: Date;

  @Column("timestamp")
  end_datetime: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    "ReservationOrderItemSchema",
    (item: ReservationOrderItemSchema) => item.order
  )
  items: ReservationOrderItemSchema[];
}
