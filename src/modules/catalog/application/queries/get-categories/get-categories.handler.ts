import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { Category } from "src/modules/catalog/domain/models/category.model";
// biome-ignore lint:reason
import { CategoryRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/category.repository";
import { GetCategoriesQuery } from "./get-categories.query";

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler
	implements IQueryHandler<GetCategoriesQuery, Category[]>
{
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async execute(): Promise<Category[]> {
		const categories = await this.categoryRepository.findAll();
		return categories;
	}
}
