import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * This is NOT the domain entity!
 * This is the database representation (persistence model)
 * We map between this and the domain entity in the repository
 */
@Entity({ schema: "booking", name: "reservation" })
@Index(["equipment_type_id", "start_datetime", "end_datetime"])
@Index(["customer_id", "created_at"])
@Index(["status"])
export class ReservationSchema {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  customer_id: string;

  @Column("uuid")
  equipment_type_id: string;

  @Column("timestamp")
  start_datetime: Date;

  @Column("timestamp")
  end_datetime: Date;

  @Column("int")
  quantity: number;

  @Column("varchar", { length: 20 })
  status: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  quoted_price?: number;

  @Column("text", { nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
