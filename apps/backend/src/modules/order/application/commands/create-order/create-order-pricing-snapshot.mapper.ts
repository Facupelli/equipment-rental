import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.value-object';
import { NewPricingResult } from 'src/modules/pricing/domain/services/new-pricing-calculator.service';
import { PricingResult } from 'src/modules/pricing/domain/services/pricing-calculator.service';
import { PricingAdjustmentSourceKind } from 'src/modules/pricing/domain/types/pricing-adjustment.types';

export function toPriceSnapshot(result: PricingResult | NewPricingResult, currency: string): PriceSnapshot {
  const discounts =
    'appliedAdjustments' in result
      ? result.appliedAdjustments.map((adjustment) => ({
          sourceKind: adjustment.sourceKind,
          sourceId: adjustment.sourceId,
          label: adjustment.label,
          type: adjustment.effectType,
          value: adjustment.configuredValue,
          discountAmount: adjustment.discountAmount.toDecimal(),
        }))
      : result.appliedDiscounts.map((discount) => ({
          sourceKind: PricingAdjustmentSourceKind.LEGACY_PRICING_RULE,
          sourceId: discount.ruleId,
          label: discount.ruleLabel,
          type: discount.type,
          value: discount.value,
          discountAmount: discount.discountAmount.toDecimal(),
        }));

  return PriceSnapshot.create({
    currency,
    basePrice: result.basePrice.toDecimal(),
    finalPrice: result.finalPrice.toDecimal(),
    totalUnits: result.totalUnits,
    pricePerBillingUnit: result.pricePerBillingUnit.toDecimal(),
    discounts,
  });
}
