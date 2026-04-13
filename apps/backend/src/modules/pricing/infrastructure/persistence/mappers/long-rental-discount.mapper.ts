import { Prisma } from 'src/generated/prisma/client';
import { LongRentalDiscount } from '../../../domain/entities/long-rental-discount.entity';
import { LongRentalDiscountTarget, LongRentalDiscountTier } from '../../../domain/types/long-rental-discount.types';

type PrismaLongRentalDiscountWithExclusions = Prisma.LongRentalDiscountGetPayload<{
  include: { exclusions: true };
}>;

export class LongRentalDiscountMapper {
  static toDomain(raw: PrismaLongRentalDiscountWithExclusions): LongRentalDiscount {
    return LongRentalDiscount.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      priority: raw.priority,
      isActive: raw.isActive,
      tiers: raw.tiers as unknown as LongRentalDiscountTier[],
      target: {
        excludedProductTypeIds: raw.exclusions.flatMap((exclusion) =>
          exclusion.productTypeId ? [exclusion.productTypeId] : [],
        ),
        excludedBundleIds: raw.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      },
    });
  }

  static toPersistence(entity: LongRentalDiscount): Prisma.LongRentalDiscountUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      priority: entity.priority,
      isActive: entity.isActive,
      tiers: entity.tiers as unknown as Prisma.InputJsonValue,
    };
  }

  static toExclusionRows(entity: LongRentalDiscount): Prisma.LongRentalDiscountExclusionCreateManyInput[] {
    return mapExclusionRows(entity.id, entity.target);
  }
}

function mapExclusionRows(
  longRentalDiscountId: string,
  target: LongRentalDiscountTarget,
): Prisma.LongRentalDiscountExclusionCreateManyInput[] {
  return [
    ...target.excludedProductTypeIds.map((productTypeId) => ({
      longRentalDiscountId,
      productTypeId,
      bundleId: null,
    })),
    ...target.excludedBundleIds.map((bundleId) => ({
      longRentalDiscountId,
      productTypeId: null,
      bundleId,
    })),
  ];
}
