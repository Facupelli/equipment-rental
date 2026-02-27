import { Prisma, PricingTier as PrismaPricingTier } from 'src/generated/prisma/client';
import { Product, ProductProps } from '../../../domain/entities/product.entity';
import { PricingTier, PricingTierProps } from '../../../domain/entities/pricing-tier.entity';
import { TrackingType } from '@repo/types';
import { IncludedItem } from 'src/modules/inventory/domain/value-objects/included-item';

export type PrismaProductBase = Prisma.ProductGetPayload<{
  include: { pricingTiers: true };
}>;

export type PrismaProductWithCategory = Prisma.ProductGetPayload<{
  include: { pricingTiers: true; category: true };
}>;

export class ProductMapper {
  public static toDomain(prismaProduct: PrismaProductBase): Product {
    const includedItems = (prismaProduct.includedItems as unknown as IncludedItem[]) ?? [];

    const props: ProductProps = {
      id: prismaProduct.id,
      tenantId: prismaProduct.tenantId,
      categoryId: prismaProduct.categoryId,
      name: prismaProduct.name,
      trackingType: prismaProduct.trackingType as TrackingType,
      attributes: prismaProduct.attributes as Record<string, unknown>,
      pricingTiers: prismaProduct.pricingTiers.map(ProductMapper.tierToDomain),
      includedItems,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    };

    return Product.reconstitute(props);
  }

  public static toPersistence(entity: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      categoryId: entity.categoryId,
      name: entity.name,
      trackingType: entity.trackingType,
      attributes: entity.attributes as unknown as Prisma.InputJsonValue,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      includedItems: entity.includedItems as unknown as Prisma.InputJsonValue,
      pricingTiers: {
        create: entity.pricingTiers.map(ProductMapper.tierToPersistenceCreate),
      },
    };
  }

  private static tierToDomain(prismaTier: PrismaPricingTier): PricingTier {
    const props: PricingTierProps = {
      id: prismaTier.id,
      tenantId: prismaTier.tenantId,
      productId: prismaTier.productId,
      inventoryItemId: prismaTier.inventoryItemId,
      billingUnitId: prismaTier.billingUnitId,
      fromUnit: prismaTier.fromUnit.toNumber(),
      pricePerUnit: prismaTier.pricePerUnit.toNumber(),
      currency: prismaTier.currency,
      createdAt: prismaTier.createdAt,
      updatedAt: prismaTier.updatedAt,
    };

    return PricingTier.reconstitute(props);
  }

  private static tierToPersistenceCreate(tier: PricingTier): Prisma.PricingTierUncheckedCreateWithoutProductInput {
    return {
      id: tier.id,
      tenantId: tier.tenantId,
      inventoryItemId: tier.inventoryItemId,
      billingUnitId: tier.billingUnitId,
      fromUnit: tier.fromUnit,
      pricePerUnit: tier.pricePerUnit,
      currency: tier.currency,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    };
  }
}
