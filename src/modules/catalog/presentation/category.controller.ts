import { Body, Controller, Get, Post } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Permission } from "src/modules/iam/domain/enums/permissions.enum";
import { RequirePermissions } from "src/modules/iam/infrastructure/decorators/permission.decorator";
import { CreateCategoryCommand } from "../application/commands/create-category/create-category.command";
// biome-ignore lint:reason
import { CreateCategoryDto } from "../application/commands/create-category/create-category.dto";
import { GetCategoriesQuery } from "../application/queries/get-categories/get-categories.query";

@Controller("categories")
export class CategoryController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get()
	@RequirePermissions(Permission.CATALOG_READ)
	async getCategories(): Promise<string[]> {
		const result = await this.queryBus.execute(new GetCategoriesQuery());

		return result;
	}

	@Post()
	@RequirePermissions(Permission.CATALOG_WRITE)
  async createCategory(
    @Body() dto: CreateCategoryDto
  ): Promise<string> {
    const category = await this.commandBus.execute(new CreateCategoryCommand(
      dto.name,
      dto.description,
    ));

    return category;
  }
}
