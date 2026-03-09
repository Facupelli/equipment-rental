import { Prisma, PricingTier as PrismaPricingTier } from 'src/generated/prisma/client';
import { PricingTier } from 'src/modules/pricing/domain/entities/pricing-tier.entity';

type PricingTierParent = { bundleId: string; productTypeId?: never } | { productTypeId: string; bundleId?: never };

export class PricingTierMapper {
  static toDomain(raw: PrismaPricingTier): PricingTier {
    return PricingTier.reconstitute({
      id: raw.id,
      bundleId: raw.bundleId,
      productTypeId: raw.productTypeId,
      locationId: raw.locationId,
      fromUnit: raw.fromUnit,
      toUnit: raw.toUnit,
      pricePerUnit: raw.pricePerUnit,
    });
  }

  static toPersistence(entity: PricingTier, parent: PricingTierParent): Prisma.PricingTierUncheckedCreateInput {
    return {
      id: entity.id,
      bundleId: parent.bundleId ?? null,
      productTypeId: parent.productTypeId ?? null,
      locationId: entity.locationId,
      fromUnit: entity.fromUnit,
      toUnit: entity.toUnit,
      pricePerUnit: entity.pricePerUnit.toString(),
    };
  }
}
