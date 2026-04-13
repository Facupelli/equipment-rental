import { PricingRuleEffectType } from '@repo/types';
import { LongRentalDiscount } from '../entities/long-rental-discount.entity';
import {
  PricingAdjustment,
  PricingAdjustmentSourceKind,
  PricingTargetContext,
} from '../types/pricing-adjustment.types';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import Decimal from 'decimal.js';

export type LongRentalDiscountMatch = {
  discount: LongRentalDiscount;
  discountPct: number;
};

export class LongRentalDiscountEvaluatorService {
  selectApplicableDiscount(
    discounts: LongRentalDiscount[],
    units: number,
    target: PricingTargetContext,
  ): LongRentalDiscountMatch | null {
    const sorted = [...discounts].sort((a, b) => a.priority - b.priority);

    for (const discount of sorted) {
      if (!discount.isActive || discount.excludes(target)) {
        continue;
      }

      const tier = discount.tiers.find(
        (candidate) => units >= candidate.fromUnits && (candidate.toUnits === null || units <= candidate.toUnits),
      );

      if (!tier || tier.discountPct <= 0) {
        continue;
      }

      return {
        discount,
        discountPct: tier.discountPct,
      };
    }

    return null;
  }

  buildAdjustment(basePrice: Money, match: LongRentalDiscountMatch): PricingAdjustment {
    return {
      sourceKind: PricingAdjustmentSourceKind.LONG_RENTAL_DISCOUNT,
      sourceId: match.discount.id,
      label: match.discount.name,
      effectType: PricingRuleEffectType.PERCENTAGE,
      configuredValue: match.discountPct,
      discountAmount: basePrice.multiply(new Decimal(match.discountPct).div(100)),
    };
  }
}
