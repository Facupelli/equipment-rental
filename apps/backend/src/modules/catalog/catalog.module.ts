import { Module } from '@nestjs/common';
import { ProductCategoryRepository } from './infrastructure/repositories/product-category.repository';
import { ProductTypeRepository } from './infrastructure/repositories/product-type.repository';
import { CreateProductTypeService } from './application/commands/create-product-type/create-product-type.service';
import { CreateProductCategoryService } from './application/commands/create-product-category/create-product-category.service';
import { GetProductTypeByIdQueryHandler } from './application/queries/get-product-type-by-id/get-product-type-by-id.query-handler';
import { GetProductTypesQueryHandler } from './application/queries/get-product-types/get-product-types.query-handler';
import { GetProductCategoriesQueryHandler } from './application/queries/get-product-categories/get-product-categories.query-handler';
import { GetRentalProductTypesQueryHandler } from './application/queries/get-rental-product-types/get-rental-product-types.query-handler';
import { CatalogPublicApi } from './catalog.public-api';
import { CatalogApplicationService } from './application/catalog.application-service';
import { CreateBundleService } from './application/commands/create-bundle/create-bundle.service';
import { GetBundlesQueryHandler } from './application/queries/get-bundles/get-bundles.query-handler';
import { BundleRepository } from './infrastructure/repositories/bundle.repository';
import { GetBundleByIdQueryHandler } from './application/queries/get-bundle-by-id/get-bundle-by-id.query-handler';
import { GetNewArrivalsQueryHandler } from './application/queries/get-rental-new-arrivals/get-rental-new-arrival.query-handler';
import { GetCombosQueryHandler } from './application/queries/get-rental-bundles/get-rental-bundles.query-handler';
import { PublishProductTypeService } from './application/commands/publish-product-type/publish-product-type.service';
import { RetireProductTypeService } from './application/commands/retire-product-type/retire-product-type.service';
import { PublishBundleService } from './application/commands/publish-bundle/publish-bundle.service';
import { RetireBundleService } from './application/commands/retire-bundle/retire-bundle.service';
import { CreateProductCategoryHttpController } from './application/commands/create-product-category/create-product-category.http.controller';
import { GetProductCategoriesHttpController } from './application/queries/get-product-categories/get-product-categories.http.controller';
import { CreateProductTypeHttpController } from './application/commands/create-product-type/create-product-type.http.controller';
import { GetProductTypesHttpController } from './application/queries/get-product-types/get-product-types.http.controller';
import { GetProductTypeByIdHttpController } from './application/queries/get-product-type-by-id/get-product-type-by-id.http.controller';
import { PublishProductTypeHttpController } from './application/commands/publish-product-type/publish-product-type.http.controller';
import { RetireProductTypeHttpController } from './application/commands/retire-product-type/retire-product-type.http.controller';
import { CreateBundleHttpController } from './application/commands/create-bundle/create-bundle.http.controller';
import { GetBundlesHttpController } from './application/queries/get-bundles/get-bundles.http.controller';
import { GetBundleByIdHttpController } from './application/queries/get-bundle-by-id/get-bundle-by-id.http.controller';
import { PublishBundleHttpController } from './application/commands/publish-bundle/publish-bundle.http.controller';
import { RetireBundleHttpController } from './application/commands/retire-bundle/retire-bundle.http.controller';
import { GetRentalProductTypesHttpController } from './application/queries/get-rental-product-types/get-rental-product-types.http.controller';
import { GetRentalBundlesHttpController } from './application/queries/get-rental-bundles/get-rental-bundles.http.controller';
import { GetNewArrivalsHttpController } from './application/queries/get-rental-new-arrivals/get-rental-new-arrival.http.controller';

const repositories = [ProductCategoryRepository, ProductTypeRepository, BundleRepository];

const commandhandlers = [
  CreateProductTypeService,
  CreateProductCategoryService,
  CreateBundleService,
  PublishProductTypeService,
  RetireProductTypeService,
  PublishBundleService,
  RetireBundleService,
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
  controllers: [
    CreateProductCategoryHttpController,
    GetProductCategoriesHttpController,
    CreateProductTypeHttpController,
    GetProductTypesHttpController,
    GetProductTypeByIdHttpController,
    PublishProductTypeHttpController,
    RetireProductTypeHttpController,
    CreateBundleHttpController,
    GetBundlesHttpController,
    GetBundleByIdHttpController,
    PublishBundleHttpController,
    RetireBundleHttpController,
    GetRentalProductTypesHttpController,
    GetRentalBundlesHttpController,
    GetNewArrivalsHttpController,
  ],
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
