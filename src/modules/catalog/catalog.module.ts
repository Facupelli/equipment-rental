import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateCategoryHandler } from "./application/commands/create-category/create-category.handler";
import { CreateEquipmentTypeHandler } from "./application/commands/create-equipment-type/create-equipment-type.handler";
import { GetCategoriesHandler } from "./application/queries/get-categories/get-categories.handler";
import { GetEquipmentTypesHandler } from "./application/queries/get-equipment-types/get-equipment-types.handler";
import { CatalogFacade } from "./catalog.facade";
import { CategoryEntity } from "./infrastructure/persistence/typeorm/category.entity";
import { CategoryRepository } from "./infrastructure/persistence/typeorm/category.repository";
import { EquipmentTypeEntity } from "./infrastructure/persistence/typeorm/equipment-type.entity";
import { EquipmentTypeRepository } from "./infrastructure/persistence/typeorm/equipment-type.repository";
import { CategoryController } from "./presentation/category.controller";
import { EquipmentTypeController } from "./presentation/equipment-type.controller";

const CommandHandlers = [CreateCategoryHandler, CreateEquipmentTypeHandler];
const QueryHandlers = [GetCategoriesHandler, GetEquipmentTypesHandler];
const EventHandlers = [];

@Module({
	imports: [
		CqrsModule,
		TypeOrmModule.forFeature([CategoryEntity, EquipmentTypeEntity]),
	],
	controllers: [CategoryController, EquipmentTypeController],
	providers: [
		CatalogFacade,
		// Application
		...CommandHandlers,
		...QueryHandlers,
		...EventHandlers,

		// Infrastructure
		CategoryRepository,
		EquipmentTypeRepository,
	],
	exports: [CatalogFacade],
})
export class CatalogModule {}
