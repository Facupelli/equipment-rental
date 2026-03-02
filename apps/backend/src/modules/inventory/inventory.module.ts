import { Module } from '@nestjs/common';
import { InventoryItemController } from './infrastructure/controllers/inventory-item.controller';
import { ProductController } from './infrastructure/controllers/product.controller';
import { ProductService } from './application/product.service';
import { PrismaProductRepository } from './infrastructure/persistance/prisma-product.repository';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PrismaInventoryItemRepository } from './infrastructure/persistance/prisma-inventory-item.repository';
import { InventoryItemService } from './application/inventory-item.service';
import { CreateBlackoutPeriodUseCase } from './application/create-blackout-period.use-case';
import { PrismaInventoryReadAdapter } from './infrastructure/persistance/prisma-rental-read.repository';
import { PrismaCategoryRepository } from './infrastructure/persistance/prisma-category.repository';
import { CategoryService } from './application/category.service';
import { CategoryController } from './infrastructure/controllers/category.controller';
import { PrismaProductQueryRepository } from './infrastructure/persistance/prisma-product-query.repository';
import { PrismaInventoryItemQueryRepository } from './infrastructure/persistance/prisma-item-query.repository';
import { PrismaBundleRepository } from './infrastructure/persistance/prisma-product-bundle.repository';
import { ProductBundleController } from './infrastructure/controllers/product-bundle.controller';
import { ProductBundleService } from './application/product-bundle.service';
import { ProductRepositoryPort } from './application/ports/product-repository.port';
import { ProductQueryPort } from './application/ports/product-query.port';
import { RentalProductQueryPort } from '../rental/application/ports/rental-product.port';
import { BundleRepositoryPort } from './application/ports/product-bundle.repository.port';
import { InventoryItemRepositoryPort } from './application/ports/inventory.repository.port';
import { InventoryItemQueryPort } from './application/ports/item-query.port';
import { CategoryRepositoryPort } from './application/ports/category.repository.port';
import { RentalInventoryReadPort } from '../rental/application/ports/rental-inventory-read.port';

const repositories = [
  {
    provide: ProductRepositoryPort,
    useClass: PrismaProductRepository,
  },
  {
    provide: ProductQueryPort,
    useClass: PrismaProductQueryRepository,
  },
  {
    provide: RentalProductQueryPort,
    useClass: PrismaProductRepository,
  },
  {
    provide: BundleRepositoryPort,
    useClass: PrismaBundleRepository,
  },
  {
    provide: InventoryItemRepositoryPort,
    useClass: PrismaInventoryItemRepository,
  },
  {
    provide: InventoryItemQueryPort,
    useClass: PrismaInventoryItemQueryRepository,
  },
  {
    provide: CategoryRepositoryPort,
    useClass: PrismaCategoryRepository,
  },
  {
    provide: RentalInventoryReadPort,
    useClass: PrismaInventoryReadAdapter,
  },
];

const providers = [
  ProductService,
  ProductBundleService,
  InventoryItemService,
  CreateBlackoutPeriodUseCase,
  CategoryService,
];

@Module({
  imports: [TenancyModule],
  controllers: [ProductController, ProductBundleController, InventoryItemController, CategoryController],
  providers: [...repositories, ...providers],
  exports: [RentalProductQueryPort, RentalInventoryReadPort],
})
export class InventoryModule {}
