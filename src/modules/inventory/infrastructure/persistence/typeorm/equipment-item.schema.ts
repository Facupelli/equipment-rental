import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import {
  EquipmentItem,
  EquipmentStatus,
} from "src/modules/inventory/domain/entities/equipment-item.entity";

@Entity("inventory_equipment_items")
export class EquipmentItemSchema {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column("uuid")
  equipmentTypeId: string;

  @Column({ type: "varchar", length: 120, unique: true })
  serialNumber: string;

  @Column({
    type: "enum",
    enum: EquipmentStatus,
    default: EquipmentStatus.Available,
  })
  status: EquipmentStatus;

  /**
   * Optimistic Locking: Automatically incremented on each update
   */
  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

export const EquipmentItemMapper = {
  toEntity(schema: EquipmentItemSchema): EquipmentItem {
    return new EquipmentItem({
      id: schema.id,
      equipmentTypeId: schema.equipmentTypeId,
      serialNumber: schema.serialNumber,
      status: schema.status,
      version: schema.version,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    });
  },

  toSchema(entity: EquipmentItem): EquipmentItemSchema {
    const schema = new EquipmentItemSchema();
    schema.id = entity.id;
    schema.equipmentTypeId = entity.equipmentTypeId;
    schema.serialNumber = entity.serialNumber;
    schema.status = entity.status;
    schema.version = entity.version;
    schema.createdAt = entity.createdAt;
    schema.updatedAt = entity.updatedAt;
    return schema;
  },
};
