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
import { RentalController } from './infrastructure/controllers/rental.controller';
import { CatalogPublicApi } from './catalog.public-api';
import { CatalogApplicationService } from './application/catalog.application-service';
import { BundleController } from './infrastructure/controllers/bundle.controller';
import { CreateBundleCommandHandler } from './application/commands/create-bundle/create-bundle.command-handler';
import { GetBundlesQueryHandler } from './application/queries/get-bundles/get-bundles.query-handler';
import { BundleRepositoryPort } from './domain/ports/bundle-repository.port';
import { BundleRepository } from './infrastructure/repositories/bundle.repository';
import { GetBundleByIdQueryHandler } from './application/queries/get-bundle-by-id/get-bundle-by-id.query-handler';
import { GetNewArrivalsQueryHandler } from './application/queries/get-rental-new-arrivals/get-rental-new-arrival.query-handler';
import { GetCombosQueryHandler } from './application/queries/get-rental-bundles/get-rental-bundles.query-handler';
import { PublishProductTypeCommandHandler } from './application/commands/publish-product-type/publish-product.command-handler';
import { RetireProductTypeCommandHandler } from './application/commands/publish-product-type/retire-product.command-handler';
import { PublishBundleCommandHandler } from './application/commands/publish-bundle/publish-bundle.command-handler';
import { RetireBundleCommandHandler } from './application/commands/publish-bundle/retire-bundle.command-handler';

const repositories = [
  { provide: ProductCategoryRepositoryPort, useClass: ProductCategoryRepository },
  { provide: ProductTypeRepositoryPort, useClass: ProductTypeRepository },
  { provide: BundleRepositoryPort, useClass: BundleRepository },
];

const commandhandlers = [
  CreateProductTypeCommandHandler,
  CreateProductCategoryHandler,
  CreateBundleCommandHandler,
  PublishProductTypeCommandHandler,
  RetireProductTypeCommandHandler,
  PublishBundleCommandHandler,
  RetireBundleCommandHandler,
];

const queryHandlers = [
  GetProductTypeByIdQueryHandler,
  GetProductTypesQueryHandler,
  GetProductCategoriesQueryHandler,
  GetBundlesQueryHandler,
  GetBundleByIdQueryHandler,
];

const rentalQueryHandlers = [GetRentalProductTypesQueryHandler, GetNewArrivalsQueryHandler, GetCombosQueryHandler];

@Module({
  imports: [TenantModule],
  controllers: [ProductCategoryController, ProductTypeController, BundleController, RentalController],
  providers: [
    ...repositories,
    ...commandhandlers,
    ...queryHandlers,
    ...rentalQueryHandlers,
    CatalogApplicationService,
    { provide: CatalogPublicApi, useClass: CatalogApplicationService },
  ],
  exports: [CatalogPublicApi],
})
export class CatalogModule {}
