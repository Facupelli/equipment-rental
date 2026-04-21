import Decimal from 'decimal.js';
import { RoundingRule } from '@repo/types';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { PricingTier } from '../entities/pricing-tier.entity';
import { Promotion } from '../entities/promotion.entity';
import { NoPricingTierFoundException } from '../exceptions/pricing-calculator.exceptions';
import { NewPricingContext } from '../types/new-pricing.types';
import { PricingAdjustment } from '../types/pricing-adjustment.types';
import { BillingUnitResolverService } from './billing-unit-resolver.service';
import { PromotionEvaluatorService } from './promotion-evaluator.service';

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
  effectiveTimezone: string;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  tiers: PricingTier[];
  promotions: Promotion[];
  context: NewPricingContext;
  currency: string;
  entityId: string;
  applyPromotions: boolean;
};

export class NewPricingCalculatorService {
  private readonly billingUnitResolver = new BillingUnitResolverService();
  private readonly promotionEvaluator = new PromotionEvaluatorService();

  calculate(input: NewPricingCalculatorInput): NewPricingResult {
    const units = this.billingUnitResolver.resolveUnits({
      period: input.period,
      billingUnitDurationMinutes: input.billingUnitDurationMinutes,
      effectiveTimezone: input.effectiveTimezone,
      weekendCountsAsOne: input.weekendCountsAsOne,
      roundingRule: input.roundingRule,
    });

    const tier = this.resolveTier(input.tiers, units, input.entityId);
    const basePrice = this.computeBasePrice(tier, units, input.currency);
    const target = {
      productTypeId: input.context.productTypeId,
      bundleId: input.context.bundleId,
    };

    const appliedAdjustments = input.applyPromotions
      ? this.promotionEvaluator.selectAdjustments(basePrice, input.promotions, input.context, target, units)
      : [];

    const totalDiscount = appliedAdjustments.reduce(
      (sum, adjustment) => sum.add(adjustment.discountAmount.toDecimal()),
      new Decimal(0),
    );

    return {
      basePrice,
      finalPrice: basePrice.subtract(Money.of(totalDiscount, input.currency)).clampAbove(Money.zero(input.currency)),
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
