import {
  ProductType as PrismaProductType,
  PricingTier as PrismaPricingTier,
  Prisma,
} from 'src/generated/prisma/client';
import { ProductType } from 'src/modules/catalog/domain/entities/product-type.entity';
import { TrackingMode } from '@repo/types';
import { InputJsonValue } from '@prisma/client/runtime/client';

type PrismaProductTypeWithRelations = PrismaProductType & {
  pricingTiers: PrismaPricingTier[];
};

export class ProductTypeMapper {
  static toDomain(raw: PrismaProductTypeWithRelations): ProductType {
    return ProductType.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      categoryId: raw.categoryId,
      billingUnitId: raw.billingUnitId,
      name: raw.name,
      description: raw.description,
      trackingMode: raw.trackingMode as TrackingMode,
      attributes: raw.attributes as Record<string, unknown>,
      includedItems: raw.includedItems as unknown[],
      isPublished: raw.publishedAt !== null,
      isRetired: raw.retiredAt !== null,
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
      attributes: entity.attributes as InputJsonValue,
      includedItems: entity.includedItems as InputJsonValue,
    };
  }
}
