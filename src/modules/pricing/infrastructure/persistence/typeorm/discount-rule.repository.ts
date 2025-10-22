import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { DiscountRule } from "src/modules/pricing/domain/models/discount-rule";
import type { Repository } from "typeorm";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { DiscountRuleEntity, discountRuleMapper } from "./discount-rule.entity";

@Injectable()
export class DiscountRuleRepository {
	constructor(
    @InjectRepository(DiscountRuleEntity)
    private readonly repo: Repository<DiscountRuleEntity>,
  ) {}

	async findAllActive(date: Date): Promise<DiscountRule[]> {
		const entities = await this.repo.find({
			where: {
				is_active: true,
				valid_from: LessThanOrEqual(date),
				valid_until: MoreThanOrEqual(date),
			},
			order: { priority: "ASC" },
		});
		return entities.map(discountRuleMapper.toDomain);
	}

	async save(rule: DiscountRule): Promise<void> {
		const entity = discountRuleMapper.toEntity(rule);
		await this.repo.save(entity);
	}

	async listAll(): Promise<DiscountRule[]> {
		const entities = await this.repo.find();
		return entities.map(discountRuleMapper.toDomain);
	}
}
