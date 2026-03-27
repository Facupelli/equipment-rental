import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.value-object';
import { PricingResult } from 'src/modules/pricing/domain/services/pricing-calculator.service';

export function toPriceSnapshot(result: PricingResult, currency: string): PriceSnapshot {
  return PriceSnapshot.create({
    currency,
    basePrice: result.basePrice.toDecimal(),
    finalPrice: result.finalPrice.toDecimal(),
    totalUnits: result.totalUnits,
    pricePerBillingUnit: result.pricePerBillingUnit.toDecimal(),
    discounts: result.appliedDiscounts.map((discount) => ({
      ruleId: discount.ruleId,
      ruleLabel: discount.ruleLabel,
      type: discount.type,
      value: discount.value,
      discountAmount: discount.discountAmount.toDecimal(),
    })),
  });
}
