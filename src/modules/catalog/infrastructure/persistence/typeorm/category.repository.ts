import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Category } from "src/modules/catalog/domain/models/category.model";
import type { Repository } from "typeorm";
import { CategoryEntity, CategoryMapper } from "./category.entity";

@Injectable()
export class CategoryRepository {
	constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>
  ) {}

	async save(category: CategoryEntity): Promise<void> {
		const entity = CategoryMapper.toEntity(category);
		await this.repository.save(entity);
	}

	async findById(id: string): Promise<Category | null> {
		const entity = await this.repository.findOneBy({ id });
		return entity ? CategoryMapper.toDomain(entity) : null;
	}

	async exists(id: string): Promise<boolean> {
		return await this.repository.exists({ where: { id } });
	}

	async findAll(): Promise<Category[]> {
		const entities = await this.repository.find({ order: { name: "ASC" } });
		return entities.map(CategoryMapper.toDomain);
	}
}
