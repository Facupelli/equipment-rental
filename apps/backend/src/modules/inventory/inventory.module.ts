import { Module } from '@nestjs/common';
import { InventoryItemController } from './infrastructure/controllers/inventory-item.controller';
import { ProductController } from './infrastructure/controllers/product.controller';
import { ProductService } from './application/product.service';
import { ProductRepositoryPort } from './domain/ports/product.repository.port';
import { PrismaProductRepository } from './infrastructure/persistance/prisma-product.repository';
import { TenancyModule } from '../tenancy/tenancy.module';
import { InventoryItemRepositoryPort } from './domain/ports/inventory.repository.port';
import { PrismaInventoryItemRepository } from './infrastructure/persistance/prisma-inventory-item.repository';
import { InventoryItemService } from './application/inventory-item.service';
import { CreateBlackoutPeriodCommand } from './application/create-blackout-period.command';
import { RentalProductQueryPort } from '../rental/domain/ports/rental-product.port';

const repositories = [
  {
    provide: ProductRepositoryPort,
    useClass: PrismaProductRepository,
  },
  {
    provide: RentalProductQueryPort,
    useClass: PrismaProductRepository,
  },
  {
    provide: InventoryItemRepositoryPort,
    useClass: PrismaInventoryItemRepository,
  },
];

const providers = [ProductService, InventoryItemService, CreateBlackoutPeriodCommand];

@Module({
  imports: [TenancyModule],
  controllers: [ProductController, InventoryItemController],
  providers: [...repositories, ...providers],
  exports: [RentalProductQueryPort],
})
export class InventoryModule {}
