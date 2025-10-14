import { Module } from "@nestjs/common";
import { CatalogFacade } from "./catalog.facade";
import { CategoryRepository } from "./infrastructure/persistence/typeorm/category.repository";
import { EquipmentTypeRepository } from "./infrastructure/persistence/typeorm/equipment-type.repository";
import { CreateCategoryHandler } from "./application/commands/create-category/create-category.handler";
import { CreateEquipmentTypeHandler } from "./application/commands/create-equipment-type/create-equipment-type.handler";
import { GetCategoriesHandler } from "./application/queries/get-categories/get-categories.handler";
import { CqrsModule } from "@nestjs/cqrs";
import { CategorySchema } from "./infrastructure/persistence/typeorm/category.schema";
import { EquipmentTypeSchema } from "./infrastructure/persistence/typeorm/equipment-type.schema";
import { TypeOrmModule } from "@nestjs/typeorm";

const CommandHandlers = [CreateCategoryHandler, CreateEquipmentTypeHandler];

const QueryHandlers = [GetCategoriesHandler];

const EventHandlers = [];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([CategorySchema, EquipmentTypeSchema]),
  ],
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
