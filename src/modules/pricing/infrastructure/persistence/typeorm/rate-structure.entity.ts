import { RateStructure } from "src/modules/pricing/domain/models/rate-structure.model";
import { Money } from "src/modules/pricing/domain/value-objects/money";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "rate_structure", schema: "pricing" })
export class RateStructureEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Index()
	@Column("uuid")
	equipment_type_id: string;

	@Column("decimal", { precision: 10, scale: 2 })
	hourly_rate: string;

	@Column("decimal", { precision: 10, scale: 2 })
	daily_rate: string;

	@Column("decimal", { precision: 10, scale: 2, default: 0 })
	minimum_charge: string;

	@Column("decimal", { precision: 5, scale: 4 })
	tax_percentage: string;

	@Column("timestamptz")
	effective_from: Date;

	@Column("timestamptz", { nullable: true })
	effective_to: Date | null;

	@Column("timestamptz", { default: () => "CURRENT_TIMESTAMP" })
	created_at: Date;

	@Column("timestamptz", { default: () => "CURRENT_TIMESTAMP" })
	updated_at: Date;
}

export const rateStructureMapper = {
	toDomain(entity: RateStructureEntity): RateStructure {
		return RateStructure.reconstitute(
			entity.id,
			entity.equipment_type_id,
			new Money(Number(entity.hourly_rate)),
			new Money(Number(entity.daily_rate)),
			new Money(Number(entity.minimum_charge)),
			Number(entity.tax_percentage),
			entity.effective_from,
			entity.effective_to ?? undefined,
		);
	},

	toEntity(model: RateStructure): RateStructureEntity {
		const entity = new RateStructureEntity();
		entity.id = model.id;
		entity.equipment_type_id = model.equipmentTypeId;
		entity.hourly_rate = model.hourlyRate.amount.toString();
		entity.daily_rate = model.dailyRate.amount.toString();
		entity.minimum_charge = model.minimumCharge.amount.toString();
		entity.tax_percentage = model.taxPercentage.toString();
		entity.effective_from = model.effectiveFrom;
		entity.effective_to = model.effectiveTo ?? null;
		entity.created_at = new Date();
		entity.updated_at = new Date();
		return entity;
	},
};
