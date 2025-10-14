import { EquipmentType } from "src/modules/catalog/domain/entities/equipment-type.entity";
import { CategoryId } from "src/modules/catalog/domain/value-objects/category-id.vo";
import { EquipmentTypeId } from "src/modules/catalog/domain/value-objects/equipment-type-id.vo";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("catalog_equipment_types")
export class EquipmentTypeSchema {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column("uuid")
  categoryId: string;
}

export const EquipmentTypeMapper = {
  toDomain(raw: EquipmentTypeSchema): EquipmentType {
    return EquipmentType.create(
      EquipmentTypeId.fromString(raw.id),
      raw.name,
      raw.description,
      CategoryId.fromString(raw.categoryId)
    );
  },

  toPersistence(entity: EquipmentType): EquipmentTypeSchema {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      categoryId: entity.categoryId.value,
    };
  },
};
