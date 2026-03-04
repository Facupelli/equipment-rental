import { Module } from '@nestjs/common';
import { ProductCategoryController } from './infrastructure/controllers/product-category.controller';
import { ProductTypeController } from './infrastructure/controllers/product-type.controller';
import { TenantModule } from '../tenant/tenant.module';
import { ProductCategoryRepositoryPort } from './domain/ports/product-catalog.repository.port';
import { ProductTypeRepositoryPort } from './domain/ports/product-type.repository.port';
import { ProductCategoryRepository } from './infrastructure/repositories/product-category.repository';
import { ProductTypeRepository } from './infrastructure/repositories/product-type.repository';
import { CreateProductTypeCommandHandler } from './application/commands/create-product-type/create-product-type.command-handler';
import { CreateProductCategoryHandler } from './application/commands/create-product-category/create-product-category.command-handler';
import { GetProductTypeByIdQueryHandler } from './application/queries/get-product-type-by-id/get-product-type-by-id.query-handler';
import { GetProductTypesQueryHandler } from './application/queries/get-product-types/get-product-types.query-handler';

const repositories = [
  { provide: ProductCategoryRepositoryPort, useClass: ProductCategoryRepository },
  { provide: ProductTypeRepositoryPort, useClass: ProductTypeRepository },
];

const commandhandlers = [CreateProductTypeCommandHandler, CreateProductCategoryHandler];

const queryHandlers = [GetProductTypeByIdQueryHandler, GetProductTypesQueryHandler];

@Module({
  imports: [TenantModule],
  controllers: [ProductCategoryController, ProductTypeController],
  providers: [...repositories, ...commandhandlers, ...queryHandlers],
})
export class CatalogModule {}
