import { Injectable } from '@nestjs/common';
import { ProductType } from '../../domain/entities/product-type.entity';
import { ProductTypeRepositoryPort } from '../../domain/ports/product-type.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { ProductTypeMapper } from '../persistence/mappers/product-type.mapper';
import { PricingTierMapper } from '../persistence/mappers/pricing-tier.mapper';

@Injectable()
export class ProductTypeRepository implements ProductTypeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<ProductType | null> {
    const raw = await this.prisma.client.productType.findUnique({
      where: { id },
      include: { pricingTiers: true },
    });
    if (!raw) return null;
    return ProductTypeMapper.toDomain(raw);
  }

  async save(productType: ProductType): Promise<string> {
    const rootData = ProductTypeMapper.toPersistence(productType);
    const currentTiers = productType.getPricingTiers();
    const currentTierIds = new Set(currentTiers.map((t) => t.id));

    await this.prisma.client.$transaction(async (tx) => {
      await tx.productType.upsert({
        where: { id: productType.id },
        create: rootData,
        update: rootData,
      });

      const existing = await tx.pricingTier.findMany({
        where: { productTypeId: productType.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((t) => t.id));

      const toDelete = [...existingIds].filter((id) => !currentTierIds.has(id));
      if (toDelete.length > 0) {
        await tx.pricingTier.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Upsert all current tiers — pricing tiers are mutable so we always
      // write the latest state, not just newly added ones
      for (const tier of currentTiers) {
        const data = PricingTierMapper.toPersistence(tier);
        await tx.pricingTier.upsert({
          where: { id: tier.id },
          create: data,
          update: data,
        });
      }
    });

    return productType.id;
  }
}
