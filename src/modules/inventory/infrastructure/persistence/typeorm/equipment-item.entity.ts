import type { AllocationEntity } from "src/modules/booking/infrastructure/persistance/typeorm/allocation.entity";
import {
	EquipmentItem,
	EquipmentStatus,
	StatusChange,
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
		default: EquipmentStatus.AVAILABLE,
	})
	status: EquipmentStatus;

	@Column({ type: "jsonb", default: [] })
	statusHistory: Array<{
		newStatus: EquipmentStatus;
		reason: string;
		changedAt: Date;
		previousStatus?: EquipmentStatus;
	}>;

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
	toDomain(entity: EquipmentItemEntity): EquipmentItem {
		const statusHistory = (entity.statusHistory || []).map(
			(h) =>
				new StatusChange(h.newStatus, h.reason, h.changedAt, h.previousStatus),
		);

		return EquipmentItem.reconstitute(
			entity.id,
			entity.equipment_type_id,
			entity.serial_number,
			entity.status,
			entity.created_at,
			statusHistory,
			entity.updated_at,
			entity.version,
		);
	},

	toEntity(domain: EquipmentItem): EquipmentItemEntity {
		const entity = new EquipmentItemEntity();
		entity.id = domain.id;
		entity.equipment_type_id = domain.equipmentTypeId;
		entity.serial_number = domain.serialNumber;
		entity.status = domain.status;
		entity.created_at = domain.createdAt;
		entity.updated_at = domain.updatedAt;
		entity.version = domain.version;

		entity.statusHistory = domain.statusHistory.map((change) => ({
			newStatus: change.newStatus,
			reason: change.reason,
			changedAt: change.changedAt,
			previousStatus: change.previousStatus,
		}));

		return entity;
	},
};
