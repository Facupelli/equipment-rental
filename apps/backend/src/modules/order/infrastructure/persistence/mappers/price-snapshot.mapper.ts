import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.vo';
import { PricingResult } from 'src/modules/pricing/domain/services/pricing-calculator';

/**
 * Maps a PricingResult (pricing module output) to a PriceSnapshot VO
 * (order module domain object).
 *
 * Lives in the application layer — the only place that can see both modules.
 * Neither the pricing module nor the order domain should know about each other.
 */
export function toPriceSnapshot(result: PricingResult, currency: string): PriceSnapshot {
  return PriceSnapshot.create({
    currency,
    basePrice: result.basePrice.toDecimal(),
    finalPrice: result.finalPrice.toDecimal(),
    totalUnits: result.totalUnits,
    pricePerBillingUnit: result.pricePerBillingUnit.toDecimal(),
    discounts: result.appliedDiscounts.map((d) => ({
      ruleId: d.ruleId,
      ruleLabel: d.ruleLabel,
      type: d.type,
      value: d.value,
      discountAmount: d.discountAmount.toDecimal(),
    })),
  });
}
