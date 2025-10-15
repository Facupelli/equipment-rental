import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import type { ReservationOrderSchema } from "./reservation-order.schema";
import type { EquipmentItemSchema } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.schema";

@Entity({ schema: "booking", name: "reservation_order_item" })
@Index(["item_id"])
@Index(["order_id"])
export class ReservationOrderItemSchema {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  order_id: string;

  @Column("uuid")
  item_id: string;

  @Column("int")
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(
    "ReservationOrderSchema",
    (order: ReservationOrderSchema) => order.items
  )
  @JoinColumn({ name: "order_id" })
  order: ReservationOrderSchema;

  @ManyToOne("EquipmentItem")
  @JoinColumn({ name: "item_id" })
  item: EquipmentItemSchema;
}
