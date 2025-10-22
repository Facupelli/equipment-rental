import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { RateStructure } from "src/modules/pricing/domain/models/rate-structure.model";
import { IsNull, LessThanOrEqual, MoreThanOrEqual, type Repository } from "typeorm";
import { RateStructureEntity, rateStructureMapper } from "./rate-structure.entity";

@Injectable()
export class RateStructureRepository {
	constructor(
    @InjectRepository(RateStructureEntity)
    private readonly repo: Repository<RateStructureEntity>,
  ) {}

	async findActiveRateForDate(
		equipmentTypeId: string,
		date: Date,
	): Promise<RateStructure | null> {
		const entity = await this.repo.findOne({
			where: [
				{
					equipment_type_id: equipmentTypeId,
					effective_from: LessThanOrEqual(date),
					effective_to: MoreThanOrEqual(date),
				},
				{
					equipment_type_id: equipmentTypeId,
					effective_from: LessThanOrEqual(date),
					effective_to: IsNull(),
				},
			],
		});
		return entity ? rateStructureMapper.toDomain(entity) : null;
	}

	async save(rateStructure: RateStructure): Promise<void> {
		const entity = rateStructureMapper.toEntity(rateStructure);
		await this.repo.save(entity);
	}

	async listAll(): Promise<RateStructure[]> {
		const entities = await this.repo.find();
		return entities.map(rateStructureMapper.toDomain);
	}
}
