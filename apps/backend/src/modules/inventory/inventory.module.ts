import { Module } from '@nestjs/common';
import { InventoryController } from './infrastructure/controllers/inventory.controller';
import { ProductController } from './infrastructure/controllers/product.controller';
import { ProductService } from './application/product.service';
import { ProductRepositoryPort } from './domain/ports/product.repository.port';
import { PrismaProductRepository } from './infrastructure/persistance/prisma-product.repository';
import { TenancyModule } from '../tenancy/tenancy.module';

@Module({
  imports: [TenancyModule],
  controllers: [InventoryController, ProductController],
  providers: [{ provide: ProductRepositoryPort, useClass: PrismaProductRepository }, ProductService],
})
export class InventoryModule {}
