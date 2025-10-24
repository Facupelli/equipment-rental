import { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "catalog", name: "equipment_types" })
export class EquipmentTypeEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@Column("uuid")
	category_id: string;

	@Column({ type: "int", default: 0 })
	buffer_days: number;

	@Column("timestamptz", { default: () => "CURRENT_TIMESTAMP" })
	created_at: Date;
}

export const EquipmentTypeMapper = {
	toDomain(schema: EquipmentTypeEntity): EquipmentType {
		return EquipmentType.reconstitute(
			schema.id,
			schema.name,
			schema.description,
			schema.category_id,
			schema.buffer_days,
			schema.created_at,
		);
	},

	toEntity(entity: EquipmentType): EquipmentTypeEntity {
		const schema = new EquipmentTypeEntity();
		schema.id = entity.id;
		schema.name = entity.name;
		schema.description = entity.description;
		schema.category_id = entity.categoryId;
		schema.buffer_days = entity.bufferDays;
		schema.created_at = entity.createdAt;
		return schema;
	},
};
