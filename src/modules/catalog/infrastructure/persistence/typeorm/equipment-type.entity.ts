import { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("catalog_equipment_types")
export class EquipmentTypeEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column("uuid")
  categoryId: string;

  @Column({ type: "int", default: 0 })
  bufferDays: number;
}

export const EquipmentTypeMapper = {
  toDomain(schema: EquipmentTypeEntity): EquipmentType {
    return new EquipmentType({
      id: schema.id,
      name: schema.name,
      description: schema.description,
      categoryId: schema.categoryId,
      bufferDays: schema.bufferDays,
    });
  },

  toEntity(entity: EquipmentType): EquipmentTypeEntity {
    const schema = new EquipmentTypeEntity();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.description = entity.description;
    schema.categoryId = entity.categoryId;
    schema.bufferDays = entity.bufferDays;
    return schema;
  },
};
