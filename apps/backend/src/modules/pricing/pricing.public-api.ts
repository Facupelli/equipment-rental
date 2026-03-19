import Decimal from 'decimal.js';
import { DateRange } from '../inventory/domain/value-objects/date-range.vo';
import { PricingResult } from './domain/services/pricing-calculator';

export type CalculateProductPriceDto = {
  tenantId: string;
  locationId: string;
  productTypeId: string;
  period: { start: Date; end: Date };
  currency: string;
  // Full count of OrderItems per category in the current order.
  // Required for VOLUME rule evaluation — cannot be derived from a single item.
  orderItemCountByCategory: Record<string, number>;
};

export type CalculateBundlePriceDto = {
  tenantId: string;
  locationId: string;
  bundleId: string;
  period: { start: Date; end: Date };
  currency: string;
  orderItemCountByCategory: Record<string, number>;
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
