import { Injectable } from '@nestjs/common';
import { ProductCategory } from '../../domain/entities/product-category.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProductCategoryMapper } from '../persistence/mappers/product-category.mapper';

@Injectable()
export class ProductCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string, tenantId: string): Promise<ProductCategory | null> {
    const raw = await this.prisma.client.productCategory.findFirst({ where: { id, tenantId } });
    if (!raw) {
      return null;
    }
    return ProductCategoryMapper.toDomain(raw);
  }

  async save(productCategory: ProductCategory): Promise<string> {
    const data = ProductCategoryMapper.toPersistence(productCategory);
    await this.prisma.client.productCategory.upsert({
      where: { id: productCategory.id },
      create: data,
      update: data,
    });
    return productCategory.id;
  }
}
