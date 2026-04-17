import Decimal from 'decimal.js';
import {
  PromotionActivationType,
  PromotionAdjustmentType,
  PromotionConditionType,
  PromotionEffectType,
  PromotionStackingType,
} from '@repo/types';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { Promotion } from '../entities/promotion.entity';
import { NewPricingContext } from '../types/new-pricing.types';
import {
  PricingAdjustment,
  PricingAdjustmentSourceKind,
  PricingTargetContext,
} from '../types/pricing-adjustment.types';

type PromotionCandidate = {
  promotion: Promotion;
  adjustment: PricingAdjustment;
};

export class PromotionEvaluatorService {
  selectAdjustments(
    basePrice: Money,
    promotions: Promotion[],
    context: NewPricingContext,
    target: PricingTargetContext,
    units: number,
  ): PricingAdjustment[] {
    const applicableCandidates = promotions
      .filter((promotion) => this.isApplicable(promotion, context, target, units))
      .map((promotion) => ({ promotion, adjustment: this.buildAdjustment(basePrice, promotion, units) }))
      .filter((candidate) => candidate.adjustment.discountAmount.toDecimal().greaterThan(0));

    const combinable = applicableCandidates.filter(
      (candidate) => candidate.promotion.stackingType === PromotionStackingType.COMBINABLE,
    );
    const exclusive = applicableCandidates.filter(
      (candidate) => candidate.promotion.stackingType === PromotionStackingType.EXCLUSIVE,
    );

    const combinableSavings = combinable.reduce(
      (sum, candidate) => sum.add(candidate.adjustment.discountAmount.toDecimal()),
      new Decimal(0),
    );
    const bestExclusive = exclusive.sort((a, b) => this.compareCandidates(a, b))[0];

    if (!bestExclusive) {
      return combinable.map((candidate) => candidate.adjustment);
    }

    if (combinableSavings.greaterThan(bestExclusive.adjustment.discountAmount.toDecimal())) {
      return combinable.map((candidate) => candidate.adjustment);
    }

    if (combinableSavings.equals(bestExclusive.adjustment.discountAmount.toDecimal()) && combinable.length > 0) {
      const highestPriorityCombinable = [...combinable].sort((a, b) => this.compareCandidates(a, b))[0];
      if (
        highestPriorityCombinable &&
        highestPriorityCombinable.promotion.priority < bestExclusive.promotion.priority
      ) {
        return combinable.map((candidate) => candidate.adjustment);
      }
    }

    return [bestExclusive.adjustment];
  }

  private buildAdjustment(basePrice: Money, promotion: Promotion, units: number): PricingAdjustment {
    const configuredPercentage = this.resolvePercentage(promotion, units);

    return {
      sourceKind: PricingAdjustmentSourceKind.PROMOTION,
      sourceId: promotion.id,
      label: promotion.name,
      effectType: PromotionAdjustmentType.PERCENTAGE,
      configuredValue: configuredPercentage,
      discountAmount: basePrice.multiply(new Decimal(configuredPercentage).div(100)),
    };
  }

  private resolvePercentage(promotion: Promotion, units: number): number {
    if (promotion.effect.type === PromotionEffectType.PERCENT_OFF) {
      return promotion.effect.percentage;
    }

    const matchedTier = promotion.effect.tiers.find(
      (tier) => units >= tier.fromUnits && (tier.toUnits === null || units <= tier.toUnits),
    );
    return matchedTier?.percentage ?? 0;
  }

  private isApplicable(
    promotion: Promotion,
    context: NewPricingContext,
    target: PricingTargetContext,
    units: number,
  ): boolean {
    if (!promotion.isAvailableAt(context.bookingCreatedAt)) {
      return false;
    }

    if (promotion.activationType === PromotionActivationType.COUPON) {
      if (!(context.applicablePromotionIds?.includes(promotion.id) ?? false)) {
        return false;
      }
    }

    if (!promotion.appliesToTarget(target)) {
      return false;
    }

    return promotion.conditions.every((condition) => {
      switch (condition.type) {
        case PromotionConditionType.BOOKING_WINDOW:
          return (
            context.bookingCreatedAt >= new Date(condition.from) && context.bookingCreatedAt <= new Date(condition.to)
          );
        case PromotionConditionType.RENTAL_WINDOW:
          return context.period.start >= new Date(condition.from) && context.period.end <= new Date(condition.to);
        case PromotionConditionType.CUSTOMER_ID_IN:
          return context.customerId ? condition.customerIds.includes(context.customerId) : false;
        case PromotionConditionType.MIN_SUBTOTAL:
          return (
            context.orderCurrency === condition.currency &&
            (context.orderSubtotalBeforePromotions ?? 0) >= condition.amount
          );
        case PromotionConditionType.RENTAL_DURATION_MIN:
          return units >= condition.minUnits;
        case PromotionConditionType.CATEGORY_ITEM_QUANTITY:
          return (context.standaloneProductQuantityByCategory[condition.categoryId] ?? 0) >= condition.minQuantity;
        case PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY:
          return (
            condition.categoryIds.filter(
              (categoryId) =>
                (context.standaloneProductQuantityByCategory[categoryId] ?? 0) >= condition.minQuantityPerCategory,
            ).length >= condition.minCategoriesMatched
          );
      }
    });
  }

  private compareCandidates(left: PromotionCandidate, right: PromotionCandidate): number {
    const savingsDifference = right.adjustment.discountAmount
      .toDecimal()
      .comparedTo(left.adjustment.discountAmount.toDecimal());
    if (savingsDifference !== 0) {
      return savingsDifference;
    }

    if (left.promotion.priority !== right.promotion.priority) {
      return left.promotion.priority - right.promotion.priority;
    }

    return left.promotion.id.localeCompare(right.promotion.id);
  }
}
