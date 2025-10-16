import { Injectable } from "@nestjs/common";
import type { Category } from "src/modules/catalog/domain/models/category.model";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "src/shared/infrastructure/database/transaction-context";
import { BaseRepository } from "src/shared/infrastructure/persistence/base-repository";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { CategoryEntity, CategoryMapper } from "./category.entity";

@Injectable()
export class CategoryRepository extends BaseRepository<CategoryEntity> {
	constructor(dataSource: DataSource, txContext: TransactionContext) {
		super(CategoryEntity, dataSource, txContext);
	}

	async save(category: Category): Promise<void> {
		const entity = CategoryMapper.toEntity(category);
		await this.managerRepo.save(entity);
	}

	async findById(id: string): Promise<Category | null> {
		const entity = await this.managerRepo.findOneBy({ id });
		return entity ? CategoryMapper.toDomain(entity) : null;
	}

	async exists(id: string): Promise<boolean> {
		return await this.managerRepo.exists({ where: { id } });
	}

	async findAll(): Promise<Category[]> {
		const entities = await this.managerRepo.find({ order: { name: "ASC" } });
		return entities.map(CategoryMapper.toDomain);
	}
}
