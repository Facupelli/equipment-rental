import { Injectable } from '@nestjs/common';
import { ProductBundle } from '../../domain/entities/product-bundle.entity';
import { BundleRepositoryPort } from '../../domain/ports/product-bundle.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { BundleMapper, PrismaBundleBase } from './mappers/bundle-product.mapper';

@Injectable()
export class PrismaBundleRepository implements BundleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(bundle: ProductBundle): Promise<string> {
    const data = BundleMapper.toPersistence(bundle);
    const created = await this.prisma.client.productBundle.create({ data });
    return created.id;
  }

  async findAll(): Promise<ProductBundle[]> {
    const records = await this.prisma.client.productBundle.findMany({
      include: { pricingTiers: true, components: true },
    });

    return records.map((r) => BundleMapper.toDomain(r as PrismaBundleBase));
  }
}
