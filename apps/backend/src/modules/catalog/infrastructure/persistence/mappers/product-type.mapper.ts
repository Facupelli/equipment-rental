import {
  ProductType as PrismaProductType,
  PricingTier as PrismaPricingTier,
  Prisma,
} from 'src/generated/prisma/client';
import { PricingTierMapper } from './pricing-tier.mapper';
import { ProductType } from 'src/modules/catalog/domain/entities/product-type.entity';
import { TrackingMode } from '@repo/types';
import { InputJsonValue } from '@prisma/client/runtime/client';

type PrismaProductTypeWithRelations = PrismaProductType & {
  pricingTiers: PrismaPricingTier[];
};

export class ProductTypeMapper {
  static toDomain(raw: PrismaProductTypeWithRelations): ProductType {
    const pricingTiers = raw.pricingTiers.map(PricingTierMapper.toDomain);
    return ProductType.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      categoryId: raw.categoryId,
      billingUnitId: raw.billingUnitId,
      name: raw.name,
      description: raw.description,
      trackingMode: raw.trackingMode as TrackingMode,
      isActive: raw.isActive,
      attributes: raw.attributes as Record<string, unknown>,
      includedItems: raw.includedItems as unknown[],
      pricingTiers,
    });
  }

  static toPersistence(entity: ProductType): Prisma.ProductTypeUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      categoryId: entity.categoryId,
      billingUnitId: entity.billingUnitId,
      name: entity.name,
      description: entity.currentDescription,
      trackingMode: entity.trackingMode,
      isActive: entity.active,
      attributes: entity.attributes as InputJsonValue,
      includedItems: entity.includedItems as InputJsonValue,
    };
  }
}
