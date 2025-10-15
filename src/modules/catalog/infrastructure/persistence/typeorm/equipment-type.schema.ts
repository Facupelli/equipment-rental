import { EquipmentType } from "src/modules/catalog/domain/entities/equipment-type.entity";
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

  @Column({ type: "int", default: 0 })
  bufferDays: number;
}

export const EquipmentTypeMapper = {
  toEntity(schema: EquipmentTypeSchema): EquipmentType {
    return new EquipmentType({
      id: schema.id,
      name: schema.name,
      description: schema.description,
      categoryId: schema.categoryId,
      bufferDays: schema.bufferDays,
    });
  },

  toSchema(entity: EquipmentType): EquipmentTypeSchema {
    const schema = new EquipmentTypeSchema();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.description = entity.description;
    schema.categoryId = entity.categoryId;
    schema.bufferDays = entity.bufferDays;
    return schema;
  },
};
