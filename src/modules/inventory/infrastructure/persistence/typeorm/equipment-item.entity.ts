// biome-ignore lint:reason
import { AllocationEntity } from "src/modules/booking/infrastructure/persistance/typeorm/allocation.entity";
import {
	EquipmentItem,
	EquipmentStatus,
} from "src/modules/inventory/domain/models/equipment-item.model";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
	VersionColumn,
} from "typeorm";

@Entity({ schema: "inventory", name: "equipment_items" })
export class EquipmentItemEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Index()
	@Column("uuid")
	equipment_type_id: string;

	@Column({ type: "varchar", length: 120, unique: true })
	serial_number: string;

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
	created_at: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updated_at: Date;

	@OneToMany(
		"AllocationEntity",
		(allocation: AllocationEntity) => allocation.equipment_item,
	)
	allocations: AllocationEntity[];
}

export const EquipmentItemMapper = {
	toDomain(schema: EquipmentItemEntity): EquipmentItem {
		return new EquipmentItem({
			id: schema.id,
			equipmentTypeId: schema.equipment_type_id,
			serialNumber: schema.serial_number,
			status: schema.status,
			version: schema.version,
			createdAt: schema.created_at,
			updatedAt: schema.updated_at,
		});
	},

	toEntity(entity: EquipmentItem): EquipmentItemEntity {
		const schema = new EquipmentItemEntity();
		schema.id = entity.id;
		schema.equipment_type_id = entity.equipmentTypeId;
		schema.serial_number = entity.serialNumber;
		schema.status = entity.status;
		schema.version = entity.version;
		schema.created_at = entity.createdAt;
		schema.updated_at = entity.updatedAt;
		return schema;
	},
};
