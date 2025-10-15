import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
} from "typeorm";
import { ReservationOrderItemEntity } from "./reservation-order-item.entity";

@Entity({ schema: "booking", name: "allocations" })
@Index(["item_id", "start_date", "end_date"])
export class AllocationEntity {
  @PrimaryGeneratedColumn("uuid", { name: "allocation_id" })
  id: string;

  @ManyToOne(() => ReservationOrderItemEntity, (item) => item.allocations, {
    onDelete: "CASCADE",
  })
  orderItem: ReservationOrderItemEntity;

  @Column({ type: "uuid", name: "item_id" })
  item_id: string;

  @Column({ type: "date", name: "start_date" })
  start_date: Date;

  @Column({ type: "date", name: "end_date" })
  end_date: Date;
}
