import Decimal from 'decimal.js';
import { Result } from 'neverthrow';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { NewPricingResult } from './domain/services/new-pricing-calculator.service';
import { PricingResult } from './domain/services/pricing-calculator.service';
import { CouponNotFoundError, CouponValidationError } from './domain/errors/pricing.errors';

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

export type CalculateProductPriceV2Dto = {
  tenantId: string;
  locationId: string;
  productTypeId: string;
  period: { start: Date; end: Date };
  currency: string;
  customerId?: string;
  applicablePromotionIds?: string[];
};

export type CalculateBundlePriceV2Dto = {
  tenantId: string;
  locationId: string;
  bundleId: string;
  period: { start: Date; end: Date };
  currency: string;
  customerId?: string;
  applicablePromotionIds?: string[];
};

export type GetComponentStandalonePricesDto = {
  tenantId: string;
  locationId: string;
  componentProductTypeIds: string[];
  period: DateRange;
};

export type ResolveCouponForPricingDto = {
  tenantId: string;
  code: string;
  customerId: string | undefined;
  now: Date;
};

export type ResolvedCouponDto = {
  couponId: string;
  ruleId: string;
};

export type RedeemCouponDto = {
  couponId: string;
  orderId: string;
  customerId: string | undefined;
  now: Date;
};

export type ResolveCouponForPricingError = CouponNotFoundError | CouponValidationError;
export type RedeemCouponError = CouponNotFoundError | CouponValidationError;

export { CouponNotFoundError, CouponValidationError };

/**
 * Cross-module contract for pricing calculations.
 * Implemented by PricingApplicationService.
 *
 * These methods are computation-oriented reads: they combine infrastructure
 * read helpers with pure pricing domain logic to produce deterministic prices.
 * They may throw pricing-owned non-HTTP errors on misconfiguration
 * (for example, unknown priced entities or missing tiers).
 */
export abstract class PricingPublicApi {
  abstract calculateProductPrice(dto: CalculateProductPriceDto): Promise<PricingResult>;
  abstract calculateBundlePrice(dto: CalculateBundlePriceDto): Promise<PricingResult>;
  abstract calculateProductPriceV2(dto: CalculateProductPriceV2Dto): Promise<NewPricingResult>;
  abstract calculateBundlePriceV2(dto: CalculateBundlePriceV2Dto): Promise<NewPricingResult>;
  abstract getComponentStandalonePrices(dto: GetComponentStandalonePricesDto): Promise<Map<string, Decimal>>;
  abstract resolveCouponForPricing(
    dto: ResolveCouponForPricingDto,
  ): Promise<Result<ResolvedCouponDto, ResolveCouponForPricingError>>;
  abstract redeemCouponWithinTransaction(
    dto: RedeemCouponDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, RedeemCouponError>>;
}
