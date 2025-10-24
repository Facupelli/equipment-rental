import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
	type GetEquipmentTypesResponseDto,
	GetEquipmentTypesSortBy,
	GetEquipmentTypesSortOrder,
} from "src/modules/catalog/application/queries/get-equipment-types/get-equipment-types.dto";
import type { GetEquipmentTypesQuery } from "src/modules/catalog/application/queries/get-equipment-types/get-equipment-types.query";
import type { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
import { RateStructureEntity } from "src/modules/pricing/infrastructure/persistence/typeorm/rate-structure.entity";
import type { Repository } from "typeorm";
import {
	EquipmentTypeEntity,
	EquipmentTypeMapper,
} from "./equipment-type.entity";

@Injectable()
export class EquipmentTypeRepository {
	constructor(
    @InjectRepository(EquipmentTypeEntity)
    private readonly repository: Repository<EquipmentTypeEntity>
  ) {}

	async save(type: EquipmentType): Promise<void> {
		const entity = EquipmentTypeMapper.toEntity(type);
		await this.repository.save(entity);
	}

	async findById(id: string): Promise<EquipmentType | null> {
		const entity = await this.repository.findOneBy({ id });
		return entity ? EquipmentTypeMapper.toDomain(entity) : null;
	}

	async findByCategoryId(categoryId: string): Promise<EquipmentType[]> {
		const entities = await this.repository.findBy({ category_id: categoryId });
		return entities.map(EquipmentTypeMapper.toDomain);
	}

	async findAll(
		options: GetEquipmentTypesQuery,
	): Promise<GetEquipmentTypesResponseDto[]> {
		const {
			categoryId,
			sortBy = GetEquipmentTypesSortBy.Created,
			sortOrder = GetEquipmentTypesSortOrder.Desc,
			page,
			pageSize,
		} = options;

		const queryBuilder = this.repository
			.createQueryBuilder("et")
			.leftJoin(
				RateStructureEntity,
				"rs",
				"rs.equipment_type_id = et.id AND CURRENT_TIMESTAMP BETWEEN rs.effective_from AND COALESCE(rs.effective_to, 'infinity'::timestamptz)",
			)
			.select([
				"et.id",
				"et.name",
				"et.description",
				"et.category_id",
				"et.buffer_days",
				"et.created_at",
			])
			.addSelect("rs.id", "rate_id")
			.addSelect("rs.hourly_rate", "rate_hourly_rate")
			.addSelect("rs.daily_rate", "rate_daily_rate")
			.addSelect("rs.minimum_charge", "rate_minimum_charge")
			.addSelect("rs.tax_percentage", "rate_tax_percentage")
			.addSelect("rs.effective_from", "rate_effective_from")
			.addSelect("rs.effective_to", "rate_effective_to");

		if (categoryId) {
			queryBuilder.andWhere("et.category_id = :categoryId", { categoryId });
		}

		if (sortBy === "created") {
			queryBuilder.orderBy("et.created_at", sortOrder);
		} else if (sortBy === "price") {
			queryBuilder
				.orderBy("CASE WHEN rs.daily_rate IS NULL THEN 1 ELSE 0 END", "ASC")
				.addOrderBy("rs.daily_rate", sortOrder, "NULLS LAST");
		}

		queryBuilder.addOrderBy("et.created_at", "DESC");

		const countQuery = this.repository
			.createQueryBuilder("et")
			.select("COUNT(DISTINCT et.id)", "count");

		if (categoryId) {
			countQuery.where("et.categoryId = :categoryId", { categoryId });
		}

		// const totalResult = await countQuery.getRawOne();
		// const total = parseInt(totalResult.count, 10);

		const offset = (page - 1) * pageSize;
		queryBuilder.skip(offset).take(pageSize);

		const rawResults = await queryBuilder.getRawMany<{
			et_id: string;
			et_name: string;
			et_description: string | null;
			et_categoryId: string;
			et_bufferDays: number;
			et_created_at: Date;
			rate_id: string;
			rate_hourly_rate: number;
			rate_daily_rate: number;
			rate_minimum_charge: number;
			rate_tax_percentage: number;
			rate_effective_from: Date;
			rate_effective_to: Date | null;
		}>();

		return rawResults.map((row) => ({
			id: row.et_id,
			name: row.et_name,
			description: row.et_description,
			categoryId: row.et_categoryId,
			bufferDays: row.et_bufferDays,
			createdAt: row.et_created_at,
			rateStructure: row.rate_id
				? {
						id: row.rate_id,
						hourlyRate: row.rate_hourly_rate,
						dailyRate: row.rate_daily_rate,
						minimumCharge: row.rate_minimum_charge,
						taxPercentage: row.rate_tax_percentage,
						effectiveFrom: row.rate_effective_from,
						effectiveTo: row.rate_effective_to,
					}
				: null,
		}));
	}
}
