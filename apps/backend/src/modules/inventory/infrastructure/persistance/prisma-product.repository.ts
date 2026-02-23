import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { ProductMapper } from './product.mapper';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return ProductMapper.toDomain(product);
  }

  async findAll(): Promise<Product[]> {
    const products = await this.prisma.client.product.findMany();
    return products.map((product) => ProductMapper.toDomain(product));
  }

  async save(product: Product): Promise<string> {
    const persistenceModel = ProductMapper.toPersistence(product);

    const createdProduct = await this.prisma.client.product.create({
      data: persistenceModel,
    });

    return createdProduct.id;
  }
}
