import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { EquipmentStatus } from "src/modules/inventory/domain/entities/equipment-item.entity";
import { ReservationId } from "src/modules/booking/domain/value-objects/reservation-id.vo";

@Entity("inventory_equipment_items")
export class EquipmentItemSchema {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column("uuid")
  equipmentTypeId: string; // FK to catalog.equipment_types.id (no DB FK needed yet)

  @Column({ type: "varchar", length: 120, unique: true })
  serialNumber: string;

  @Column({
    type: "enum",
    enum: EquipmentStatus,
    default: EquipmentStatus.Available,
  })
  status: EquipmentStatus;

  @Column({
    name: "allocated_to_reservation_id",
    type: "uuid",
    nullable: true,
  })
  allocatedToReservationId: ReservationId | null;

  @Column({ name: "allocated_until", type: "timestamp", nullable: true })
  allocatedUntil: Date | null;

  /**
   * Optimistic Locking: Automatically incremented on each update
   * When updating, TypeORM adds: WHERE version = X
   * If another transaction updated first, affected rows = 0, throws error
   */
  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
