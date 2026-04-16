import { Prisma } from 'src/generated/prisma/client';
import {
  PromotionActivationType,
  PromotionApplicability,
  PromotionApplicabilityTarget,
  PromotionCondition,
  PromotionEffect,
  PromotionStackingType,
} from '../../../domain/types/promotion.types';
import { Promotion } from '../../../domain/entities/promotion.entity';

type PrismaPromotionWithExclusions = Prisma.PromotionGetPayload<{
  include: { exclusions: true };
}>;

type PersistedPromotionConditionEnvelope = {
  validFrom?: string | null;
  validUntil?: string | null;
  conditions?: PromotionCondition[];
  appliesTo?: PromotionApplicabilityTarget[];
};

export class PromotionMapper {
  static toDomain(raw: PrismaPromotionWithExclusions): Promotion {
    const conditionEnvelope = (raw.condition ?? {}) as PersistedPromotionConditionEnvelope;
    const applicability: PromotionApplicability = {
      appliesTo: conditionEnvelope.appliesTo ?? [
        PromotionApplicabilityTarget.PRODUCT,
        PromotionApplicabilityTarget.BUNDLE,
      ],
      excludedProductTypeIds: raw.exclusions.flatMap((exclusion) =>
        exclusion.productTypeId ? [exclusion.productTypeId] : [],
      ),
      excludedBundleIds: raw.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
    };

    return Promotion.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      activationType: raw.type === 'COUPON' ? PromotionActivationType.COUPON : PromotionActivationType.AUTOMATIC,
      priority: raw.priority,
      stackingType: raw.stackable ? PromotionStackingType.COMBINABLE : PromotionStackingType.EXCLUSIVE,
      validFrom: conditionEnvelope.validFrom ? new Date(conditionEnvelope.validFrom) : null,
      validUntil: conditionEnvelope.validUntil ? new Date(conditionEnvelope.validUntil) : null,
      isActive: raw.isActive,
      conditions: conditionEnvelope.conditions ?? [],
      applicability,
      effect: raw.effect as unknown as PromotionEffect,
    });
  }

  static toPersistence(entity: Promotion): Prisma.PromotionUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      // Transitional persistence mapping until Prisma schema is regenerated.
      type: (entity.activationType === PromotionActivationType.COUPON ? 'COUPON' : 'SEASONAL') as never,
      priority: entity.priority,
      stackable: entity.stackingType === PromotionStackingType.COMBINABLE,
      isActive: entity.isActive,
      condition: {
        validFrom: entity.validFrom?.toISOString() ?? null,
        validUntil: entity.validUntil?.toISOString() ?? null,
        conditions: entity.conditions,
        appliesTo: entity.applicability.appliesTo,
      } as unknown as Prisma.InputJsonValue,
      effect: entity.effect as unknown as Prisma.InputJsonValue,
    };
  }

  static toExclusionRows(entity: Promotion): Prisma.PromotionExclusionCreateManyInput[] {
    return [
      ...entity.applicability.excludedProductTypeIds.map((productTypeId) => ({
        promotionId: entity.id,
        productTypeId,
        bundleId: null,
      })),
      ...entity.applicability.excludedBundleIds.map((bundleId) => ({
        promotionId: entity.id,
        productTypeId: null,
        bundleId,
      })),
    ];
  }
}
