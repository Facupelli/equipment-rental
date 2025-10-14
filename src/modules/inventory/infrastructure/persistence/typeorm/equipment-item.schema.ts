import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { EquipmentItem } from "src/modules/inventory/domain/entities/equipment-item.entity";

@Entity("inventory_equipment_items")
export class EquipmentItemSchema {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column("uuid")
  equipmentTypeId: string; // FK to catalog.equipment_types.id (no DB FK needed yet)

  @Column({ type: "varchar", length: 120, unique: true })
  serialNumber: string;

  @Index()
  @Column({ type: "varchar", length: 30 })
  status: string; // 'Available' | 'Allocated' | 'Maintenance'
}

export const EquipmentItemMapper = {
  toDomain(raw: EquipmentItemSchema): EquipmentItem {
    return EquipmentItem.create(raw.id, raw.equipmentTypeId, raw.serialNumber);
  },

  toPersistence(entity: EquipmentItem): EquipmentItemSchema {
    return {
      id: entity.id,
      equipmentTypeId: entity.equipmentTypeId,
      serialNumber: entity.serialNumber,
      status: entity.status,
    };
  },
};
