import { Prisma, PricingTier as PrismaPricingTier } from 'src/generated/prisma/client';
import { Product, ProductProps } from '../../../domain/entities/product.entity';
import { PricingTier, PricingTierProps } from '../../../domain/entities/pricing-tier.entity';
import { TrackingType } from '@repo/types';
import { PricingTierResponseDto, ProductResponseDto } from '@repo/schemas';

/**
 * The Prisma payload type for a Product with its PricingTier children included.
 * Used as the input type for toDomain — enforces that the query always
 * includes tiers, preventing silent mapping failures at runtime.
 */
export type PrismaProductWithTiers = Prisma.ProductGetPayload<{
  include: { pricingTiers: true };
}>;

export class ProductMapper {
  public static toDomain(prismaProduct: PrismaProductWithTiers): Product {
    const props: ProductProps = {
      id: prismaProduct.id,
      tenantId: prismaProduct.tenantId,
      name: prismaProduct.name,
      trackingType: prismaProduct.trackingType as TrackingType,
      attributes: prismaProduct.attributes as Record<string, unknown>,
      pricingTiers: prismaProduct.pricingTiers.map(ProductMapper.tierToDomain),
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    };

    return Product.reconstitute(props);
  }

  public static toPersistence(entity: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      trackingType: entity.trackingType,
      attributes: entity.attributes as unknown as Prisma.InputJsonValue,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      pricingTiers: {
        create: entity.pricingTiers.map(ProductMapper.tierToPersistenceCreate),
      },
    };
  }

  public static toResponse(entity: Product): ProductResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      trackingType: entity.trackingType,
      attributes: entity.attributes,
      pricingTiers: entity.pricingTiers.map(ProductMapper.tierToResponse),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
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

  private static tierToResponse(tier: PricingTier): PricingTierResponseDto {
    return {
      id: tier.id,
      fromUnit: tier.fromUnit,
      pricePerUnit: tier.pricePerUnit,
      currency: tier.currency,
    };
  }
}
