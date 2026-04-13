import { Prisma } from 'src/generated/prisma/client';
import { Promotion } from '../../../domain/entities/promotion.entity';
import {
  PromotionCondition,
  PromotionEffect,
  PromotionTarget,
  PromotionType,
} from '../../../domain/types/promotion.types';

type PrismaPromotionWithExclusions = Prisma.PromotionGetPayload<{
  include: { exclusions: true };
}>;

export class PromotionMapper {
  static toDomain(raw: PrismaPromotionWithExclusions): Promotion {
    return Promotion.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      type: raw.type as PromotionType,
      priority: raw.priority,
      stackable: raw.stackable,
      isActive: raw.isActive,
      condition: raw.condition as unknown as PromotionCondition,
      effect: raw.effect as unknown as PromotionEffect,
      target: {
        excludedProductTypeIds: raw.exclusions.flatMap((exclusion) =>
          exclusion.productTypeId ? [exclusion.productTypeId] : [],
        ),
        excludedBundleIds: raw.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      },
    });
  }

  static toPersistence(entity: Promotion): Prisma.PromotionUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      type: entity.type,
      priority: entity.priority,
      stackable: entity.stackable,
      isActive: entity.isActive,
      condition: entity.condition as unknown as Prisma.InputJsonValue,
      effect: entity.effect as unknown as Prisma.InputJsonValue,
    };
  }

  static toExclusionRows(entity: Promotion): Prisma.PromotionExclusionCreateManyInput[] {
    return mapExclusionRows(entity.id, entity.target);
  }
}

function mapExclusionRows(promotionId: string, target: PromotionTarget): Prisma.PromotionExclusionCreateManyInput[] {
  return [
    ...target.excludedProductTypeIds.map((productTypeId) => ({
      promotionId,
      productTypeId,
      bundleId: null,
    })),
    ...target.excludedBundleIds.map((bundleId) => ({
      promotionId,
      productTypeId: null,
      bundleId,
    })),
  ];
}
