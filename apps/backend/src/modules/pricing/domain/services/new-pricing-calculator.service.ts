import Decimal from 'decimal.js';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { LongRentalDiscount } from '../entities/long-rental-discount.entity';
import { PricingTier } from '../entities/pricing-tier.entity';
import { Promotion } from '../entities/promotion.entity';
import { NoPricingTierFoundException } from '../exceptions/pricing-calculator.exceptions';
import { NewPricingContext } from '../types/new-pricing.types';
import { PricingAdjustment } from '../types/pricing-adjustment.types';
import { BillingUnitResolverService } from './billing-unit-resolver.service';
import { LongRentalDiscountEvaluatorService } from './long-rental-discount-evaluator.service';
import { PromotionEvaluatorService } from './promotion-evaluator.service';
import { PricingRuleEffectType, RoundingRule } from '@repo/types';

export type NewPricingResult = {
  basePrice: Money;
  finalPrice: Money;
  pricePerBillingUnit: Money;
  totalUnits: number;
  appliedAdjustments: PricingAdjustment[];
};

export type NewPricingCalculatorInput = {
  period: DateRange;
  billingUnitDurationMinutes: number;
  tenantTimezone: string;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  tiers: PricingTier[];
  longRentalDiscounts: LongRentalDiscount[];
  promotions: Promotion[];
  context: NewPricingContext;
  currency: string;
  entityId: string;
};

export class NewPricingCalculatorService {
  private readonly billingUnitResolver = new BillingUnitResolverService();
  private readonly longRentalEvaluator = new LongRentalDiscountEvaluatorService();
  private readonly promotionEvaluator = new PromotionEvaluatorService();

  calculate(input: NewPricingCalculatorInput): NewPricingResult {
    const units = this.billingUnitResolver.resolveUnits({
      period: input.period,
      billingUnitDurationMinutes: input.billingUnitDurationMinutes,
      tenantTimezone: input.tenantTimezone,
      weekendCountsAsOne: input.weekendCountsAsOne,
      roundingRule: input.roundingRule,
    });

    const tier = this.resolveTier(input.tiers, units, input.entityId);
    const basePrice = this.computeBasePrice(tier, units, input.currency);
    const target = {
      productTypeId: input.context.productTypeId,
      bundleId: input.context.bundleId,
    };

    const appliedAdjustments: PricingAdjustment[] = [];
    let runningPrice = basePrice;

    const matchedLongRentalDiscount = this.longRentalEvaluator.selectApplicableDiscount(
      input.longRentalDiscounts,
      units,
      target,
    );

    if (matchedLongRentalDiscount) {
      const adjustment = this.longRentalEvaluator.buildAdjustment(basePrice, matchedLongRentalDiscount);
      appliedAdjustments.push(adjustment);
      runningPrice = runningPrice.subtract(adjustment.discountAmount);
    }

    const applicablePromotions = this.promotionEvaluator.selectApplicablePromotions(
      input.promotions,
      input.context,
      target,
    );
    const promotionAdjustments = this.promotionEvaluator.buildAdjustments(runningPrice, applicablePromotions);

    const percentagePromotionAdjustments = promotionAdjustments.filter(
      (adjustment) => adjustment.effectType === PricingRuleEffectType.PERCENTAGE,
    );
    const flatPromotionAdjustments = promotionAdjustments.filter(
      (adjustment) => adjustment.effectType === PricingRuleEffectType.FLAT,
    );

    if (percentagePromotionAdjustments.length > 0) {
      const totalPercentage = percentagePromotionAdjustments.reduce(
        (sum, adjustment) => sum + adjustment.configuredValue,
        0,
      );
      const combinedDiscount = runningPrice.multiply(new Decimal(totalPercentage).div(100));

      appliedAdjustments.push(...percentagePromotionAdjustments);
      runningPrice = runningPrice.subtract(combinedDiscount);
    }

    if (flatPromotionAdjustments.length > 0) {
      appliedAdjustments.push(...flatPromotionAdjustments);
      for (const adjustment of flatPromotionAdjustments) {
        runningPrice = runningPrice.subtract(adjustment.discountAmount);
      }
    }

    return {
      basePrice,
      finalPrice: runningPrice.clampAbove(Money.zero(input.currency)),
      pricePerBillingUnit: Money.of(tier.pricePerUnit, input.currency),
      totalUnits: units,
      appliedAdjustments,
    };
  }

  private resolveTier(tiers: PricingTier[], units: number, entityId: string): PricingTier {
    const match = tiers.find((tier) => tier.coversUnits(units));
    if (!match) {
      throw new NoPricingTierFoundException(units, entityId);
    }
    return match;
  }

  private computeBasePrice(tier: PricingTier, units: number, currency: string): Money {
    return Money.of(tier.pricePerUnit.mul(units), currency);
  }
}
