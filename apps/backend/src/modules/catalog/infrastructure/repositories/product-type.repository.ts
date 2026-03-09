import { Injectable } from '@nestjs/common';
import { ProductType } from '../../domain/entities/product-type.entity';
import { ProductTypeRepositoryPort } from '../../domain/ports/product-type.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProductTypeMapper } from '../persistence/mappers/product-type.mapper';

@Injectable()
export class ProductTypeRepository implements ProductTypeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<ProductType | null> {
    const raw = await this.prisma.client.productType.findUnique({
      where: { id },
      include: { pricingTiers: true },
    });

    if (!raw) {
      return null;
    }

    return ProductTypeMapper.toDomain(raw);
  }

  async save(productType: ProductType): Promise<string> {
    const rootData = ProductTypeMapper.toPersistence(productType);

    await this.prisma.client.productType.upsert({
      where: { id: productType.id },
      create: rootData,
      update: rootData,
    });

    return productType.id;
  }
}
