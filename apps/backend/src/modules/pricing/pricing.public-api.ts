import Decimal from 'decimal.js';
import { DateRange } from '../inventory/domain/value-objects/date-range.vo';
import { PricingResult } from './domain/services/pricing-calculator';

export type CalculateProductPriceDto = {
  tenantId: string;
  locationId: string;
  productTypeId: string;
  period: { start: Date; end: Date };
  currency: string;
  orderItemCountByCategory: Record<string, number>;
  // Optional — only present when a coupon has been pre-validated upstream.
  // Injected into RuleApplicationContext for COUPON rule evaluation.
  applicableCouponRuleIds?: string[];
  // Optional — only present for authenticated customer orders.
  // Injected into RuleApplicationContext for CUSTOMER_SPECIFIC rule evaluation.
  customerId?: string;
};

export type CalculateBundlePriceDto = {
  tenantId: string;
  locationId: string;
  bundleId: string;
  period: { start: Date; end: Date };
  currency: string;
  orderItemCountByCategory: Record<string, number>;
  applicableCouponRuleIds?: string[];
  customerId?: string;
};

export type GetComponentStandalonePricesDto = {
  tenantId: string;
  locationId: string;
  componentProductTypeIds: string[];
  period: DateRange;
};

/**
 * Cross-module contract for pricing calculations.
 * Implemented by PricingApplicationService.
 *
 * Both methods throw on misconfiguration (no tier found, unknown entity).
 * They do not return Result — a pricing failure is not a recoverable
 * business outcome, it indicates a catalog setup problem.
 */
export abstract class PricingPublicApi {
  abstract calculateProductPrice(dto: CalculateProductPriceDto): Promise<PricingResult>;
  abstract calculateBundlePrice(dto: CalculateBundlePriceDto): Promise<PricingResult>;
  abstract getComponentStandalonePrices(dto: GetComponentStandalonePricesDto): Promise<Map<string, Decimal>>;
}
