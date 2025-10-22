import { DiscountRule } from "src/modules/pricing/domain/models/discount-rule";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "discount_rule", schema: "pricing" })
export class DiscountRuleEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column("varchar", { length: 255 })
	name: string;

	@Column("varchar", { length: 20 })
	type: string;

	@Column("decimal", { precision: 5, scale: 4 })
	discount_percentage: string;

	@Column("jsonb")
	eligibility_criteria: Record<string, any>;

	@Column("timestamptz")
	valid_from: Date;

	@Column("timestamptz")
	valid_until: Date;

	@Column("boolean", { default: true })
	is_active: boolean;

	@Column("boolean", { default: false })
	stackable: boolean;

	@Column("int", { default: 100 })
	priority: number;
}

export const discountRuleMapper = {
	toDomain(entity: DiscountRuleEntity): DiscountRule {
		return new DiscountRule(
			entity.id,
			entity.name,
			entity.type as any,
			Number(entity.discount_percentage),
			entity.eligibility_criteria,
			entity.valid_from,
			entity.valid_until,
			entity.is_active,
			entity.stackable,
			entity.priority,
		);
	},

	toEntity(model: DiscountRule): DiscountRuleEntity {
		const entity = new DiscountRuleEntity();
		entity.id = model.id;
		entity.name = model.name;
		entity.type = model.type;
		entity.discount_percentage = model.discountPercentage.toString();
		entity.eligibility_criteria = model.eligibilityCriteria;
		entity.valid_from = model.validFrom;
		entity.valid_until = model.validUntil;
		entity.is_active = model.isActive;
		entity.stackable = model.stackable;
		entity.priority = model.priority;
		return entity;
	},
};
