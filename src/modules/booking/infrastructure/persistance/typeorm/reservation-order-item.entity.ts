import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import type { ReservationOrderEntity } from "./reservation-order.entity";
import { AllocationEntity } from "./allocation.entity";

@Entity({ schema: "booking", name: "reservation_order_item" })
@Index(["item_id"])
@Index(["order_id"])
export class ReservationOrderItemEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  item_id: string;

  @Column("int")
  quantity: number;

  @ManyToOne(
    "ReservationOrderEntity",
    (order: ReservationOrderEntity) => order.items,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "order_id" })
  order: ReservationOrderEntity;

  @OneToMany(() => AllocationEntity, (allocation) => allocation.orderItem, {
    cascade: true,
  })
  allocations: AllocationEntity[];
}
