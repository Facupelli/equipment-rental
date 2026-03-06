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
import { GetProductCategoriesQueryHandler } from './application/queries/get-product-categories/get-product-categories.query-handler';
import { GetRentalProductTypesQueryHandler } from './application/queries/get-reantal-product-types/get-rental-product-types.query-handler';
import { RentalProductTypeController } from './infrastructure/controllers/rental-product-type.controller';
import { CatalogPublicApi } from './catalog.public-api';
import { CatalogApplicationService } from './application/catalog.application-service';

const repositories = [
  { provide: ProductCategoryRepositoryPort, useClass: ProductCategoryRepository },
  { provide: ProductTypeRepositoryPort, useClass: ProductTypeRepository },
];

const commandhandlers = [CreateProductTypeCommandHandler, CreateProductCategoryHandler];

const queryHandlers = [
  GetProductTypeByIdQueryHandler,
  GetProductTypesQueryHandler,
  GetProductCategoriesQueryHandler,
  GetRentalProductTypesQueryHandler,
];

@Module({
  imports: [TenantModule],
  controllers: [ProductCategoryController, ProductTypeController, RentalProductTypeController],
  providers: [
    ...repositories,
    ...commandhandlers,
    ...queryHandlers,
    { provide: CatalogPublicApi, useClass: CatalogApplicationService },
  ],
  exports: [CatalogPublicApi],
})
export class CatalogModule {}
