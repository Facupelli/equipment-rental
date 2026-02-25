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
import { RentalInventoryReadPort } from '../rental/domain/ports/rental-inventory-read.port';
import { PrismaInventoryReadAdapter } from './infrastructure/persistance/prisma-rental-read.repository';

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
  {
    provide: RentalInventoryReadPort,
    useClass: PrismaInventoryReadAdapter,
  },
];

const providers = [ProductService, InventoryItemService, CreateBlackoutPeriodCommand];

@Module({
  imports: [TenancyModule],
  controllers: [ProductController, InventoryItemController],
  providers: [...repositories, ...providers],
  exports: [RentalProductQueryPort, RentalInventoryReadPort],
})
export class InventoryModule {}
