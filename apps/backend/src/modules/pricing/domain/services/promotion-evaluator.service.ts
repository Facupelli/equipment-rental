import Decimal from 'decimal.js';
import { Promotion } from '../entities/promotion.entity';
import { PromotionType } from '../types/promotion.types';
import { NewPricingContext } from '../types/new-pricing.types';
import {
  PricingAdjustment,
  PricingAdjustmentSourceKind,
  PricingTargetContext,
} from '../types/pricing-adjustment.types';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { PricingRuleEffectType } from '@repo/types';

export class PromotionEvaluatorService {
  selectApplicablePromotions(
    promotions: Promotion[],
    context: NewPricingContext,
    target: PricingTargetContext,
  ): Promotion[] {
    const applicable = promotions.filter((promotion) => this.isApplicable(promotion, context, target));

    const nonStackable = applicable.filter((promotion) => !promotion.stackable).sort((a, b) => a.priority - b.priority);
    const stackable = applicable.filter((promotion) => promotion.stackable).sort((a, b) => a.priority - b.priority);

    return [...(nonStackable.length > 0 ? [nonStackable[0]] : []), ...stackable];
  }

  buildAdjustments(basePrice: Money, promotions: Promotion): PricingAdjustment;
  buildAdjustments(basePrice: Money, promotions: Promotion[]): PricingAdjustment[];
  buildAdjustments(basePrice: Money, promotions: Promotion | Promotion[]): PricingAdjustment | PricingAdjustment[] {
    if (!Array.isArray(promotions)) {
      return this.buildSingleAdjustment(basePrice, promotions);
    }

    return promotions.map((promotion) => this.buildSingleAdjustment(basePrice, promotion));
  }

  private buildSingleAdjustment(basePrice: Money, promotion: Promotion): PricingAdjustment {
    if (promotion.effect.type === PricingRuleEffectType.PERCENTAGE) {
      return {
        sourceKind: PricingAdjustmentSourceKind.PROMOTION,
        sourceId: promotion.id,
        label: promotion.name,
        effectType: PricingRuleEffectType.PERCENTAGE,
        configuredValue: promotion.effect.value,
        discountAmount: basePrice.multiply(new Decimal(promotion.effect.value).div(100)),
      };
    }

    return {
      sourceKind: PricingAdjustmentSourceKind.PROMOTION,
      sourceId: promotion.id,
      label: promotion.name,
      effectType: PricingRuleEffectType.FLAT,
      configuredValue: promotion.effect.value,
      discountAmount: Money.of(promotion.effect.value, basePrice.currency),
    };
  }

  private isApplicable(promotion: Promotion, context: NewPricingContext, target: PricingTargetContext): boolean {
    if (!promotion.isActive || promotion.excludes(target)) {
      return false;
    }

    switch (promotion.condition.type) {
      case PromotionType.SEASONAL: {
        const from = new Date(promotion.condition.dateFrom);
        const to = new Date(promotion.condition.dateTo);
        return context.period.start >= from && context.period.start <= to;
      }

      case PromotionType.COUPON:
        return context.applicablePromotionIds?.includes(promotion.id) ?? false;

      case PromotionType.CUSTOMER_SPECIFIC:
        return context.customerId === promotion.condition.customerId;
    }
  }
}
