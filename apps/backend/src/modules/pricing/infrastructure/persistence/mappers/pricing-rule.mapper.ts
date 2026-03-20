import { PricingRuleScope, PricingRuleType } from '@repo/types';
import { PricingRule as PrismaPricingRule, Prisma } from 'src/generated/prisma/client';
import { PricingRule } from 'src/modules/pricing/domain/entities/pricing-rule.entity';
import { PricingRuleCondition, PricingRuleEffect } from 'src/modules/pricing/domain/types/pricing-rule.types';

export class PricingRuleMapper {
  static toDomain(raw: PrismaPricingRule): PricingRule {
    return PricingRule.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      type: raw.type as PricingRuleType,
      scope: raw.scope as PricingRuleScope,
      priority: raw.priority,
      stackable: raw.stackable,
      isActive: raw.isActive,
      condition: raw.condition as PricingRuleCondition,
      effect: raw.effect as PricingRuleEffect,
    });
  }

  static toPersistence(entity: PricingRule): Prisma.PricingRuleUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      type: entity.type,
      scope: entity.scope,
      priority: entity.priority,
      stackable: entity.stackable,
      isActive: entity.active,
      condition: entity.condition,
      effect: entity.effect,
    };
  }
}
