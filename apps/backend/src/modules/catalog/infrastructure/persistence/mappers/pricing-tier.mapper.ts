import { PricingTier as PrismaPricingTier, Prisma } from 'src/generated/prisma/client';
import { PricingTier } from 'src/modules/catalog/domain/entities/pricing-tier.entity';

export class PricingTierMapper {
  static toDomain(raw: PrismaPricingTier): PricingTier {
    return PricingTier.reconstitute({
      id: raw.id,
      productTypeId: raw.productTypeId,
      bundleId: raw.bundleId,
      locationId: raw.locationId,
      fromUnit: raw.fromUnit,
      toUnit: raw.toUnit,
      pricePerUnit: raw.pricePerUnit,
    });
  }

  static toPersistence(entity: PricingTier): Prisma.PricingTierUncheckedCreateInput {
    return {
      id: entity.id,
      productTypeId: entity.productTypeId,
      bundleId: entity.bundleId,
      locationId: entity.locationId,
      fromUnit: entity.fromUnit,
      toUnit: entity.toUnit,
      pricePerUnit: entity.pricePerUnit,
    };
  }
}
