import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { Category } from "src/modules/catalog/domain/models/category.model";
// biome-ignore lint: /style/useImportType
import { CategoryRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/category.repository";
import { v4 as uuidv4 } from "uuid";
import { CreateCategoryCommand } from "./create-category.command";

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler
	implements ICommandHandler<CreateCategoryCommand, string>
{
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async execute(command: CreateCategoryCommand): Promise<string> {
		const category = new Category({
			id: uuidv4(),
			name: command.name,
			description: command.description,
		});

		await this.categoryRepository.save(category);
		return category.id;
	}
}
