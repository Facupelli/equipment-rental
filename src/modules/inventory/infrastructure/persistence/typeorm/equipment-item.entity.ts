import type { AllocationEntity } from "src/modules/booking/infrastructure/persistance/typeorm/allocation.entity";
import {
	EquipmentItem,
	EquipmentStatus,
	LocationChange,
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

	// TODO: separate status history into a separate table
	@Column({ type: "jsonb", default: [] })
	statusHistory: Array<{
		newStatus: EquipmentStatus;
		reason: string;
		changedAt: Date;
		previousStatus?: EquipmentStatus;
	}>;

	@Column("uuid", { nullable: true })
	current_location_id: string;

	// TODO: separate location history into a separate table
	@Column({ type: "jsonb", default: [] })
	locationHistory: Array<{
		newLocationId: string;
		reason: string;
		changedAt: Date;
		previousLocationId?: string;
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

		const locationHistory = (entity.locationHistory || []).map(
			(h) =>
				new LocationChange(
					h.newLocationId,
					h.reason,
					h.changedAt,
					h.previousLocationId,
				),
		);

		return EquipmentItem.reconstitute(
			entity.id,
			entity.equipment_type_id,
			entity.serial_number,
			entity.status,
			entity.created_at,
			statusHistory,
			locationHistory,
			entity.updated_at,
			entity.version,
			entity.current_location_id,
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
		entity.current_location_id = domain.currentLocationId;

		entity.statusHistory = domain.statusHistory.map((change) => ({
			newStatus: change.newStatus,
			reason: change.reason,
			changedAt: change.changedAt,
			previousStatus: change.previousStatus,
		}));

		entity.locationHistory = domain.locationHistory.map((change) => ({
			newLocationId: change.newLocationId,
			reason: change.reason,
			changedAt: change.changedAt,
			previousLocationId: change.previousLocationId,
		}));

		return entity;
	},
};
