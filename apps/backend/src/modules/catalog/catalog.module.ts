import { Module } from '@nestjs/common';
import { ProductCategoryController } from './infrastructure/controllers/product-category.controller';
import { ProductCategoryService } from './application/product-category.service';
import { ProductTypeController } from './infrastructure/controllers/product-type.controller';
import { ProductTypeService } from './application/product-type.service';
import { TenantModule } from '../tenant/tenant.module';
import { ProductCategoryRepositoryPort } from './domain/ports/product-catalog.repository.port';
import { ProductTypeRepositoryPort } from './domain/ports/product-type.repository.port';
import { ProductCategoryRepository } from './infrastructure/repositories/product-category.repository';
import { ProductTypeRepository } from './infrastructure/repositories/product-type.repository';

const repositories = [
  { provide: ProductCategoryRepositoryPort, useClass: ProductCategoryRepository },
  { provide: ProductTypeRepositoryPort, useClass: ProductTypeRepository },
];

@Module({
  imports: [TenantModule],
  controllers: [ProductCategoryController, ProductTypeController],
  providers: [...repositories, ProductCategoryService, ProductTypeService],
})
export class CatalogModule {}
