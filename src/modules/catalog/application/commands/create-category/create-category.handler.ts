import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { Category } from "src/modules/catalog/domain/models/category.model";
// biome-ignore lint: /style/useImportType
import { CategoryRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/category.repository";
import { CreateCategoryCommand } from "./create-category.command";

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler
	implements ICommandHandler<CreateCategoryCommand, Category>
{
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async execute(command: CreateCategoryCommand): Promise<Category> {
		const category = new Category({
			name: command.name,
			description: command.description,
		});

		return await this.categoryRepository.save(category);
	}
}
