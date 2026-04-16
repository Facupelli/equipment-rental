import Decimal from 'decimal.js';
import { Result } from 'neverthrow';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { NewPricingResult } from './domain/services/new-pricing-calculator.service';
import { CouponNotFoundError, CouponValidationError } from './domain/errors/pricing.errors';

type BasePriceContextDto = {
  bookingCreatedAt?: Date;
  customerId?: string;
  applicablePromotionIds?: string[];
  standaloneProductQuantityByCategory?: Record<string, number>;
  orderSubtotalBeforePromotions?: number;
  applyPromotions?: boolean;
};

export type CalculateProductPriceV2Dto = BasePriceContextDto & {
  tenantId: string;
  locationId: string;
  productTypeId: string;
  period: { start: Date; end: Date } | DateRange;
  currency: string;
};

export type CalculateBundlePriceV2Dto = BasePriceContextDto & {
  tenantId: string;
  locationId: string;
  bundleId: string;
  period: { start: Date; end: Date } | DateRange;
  currency: string;
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
  promotionId: string;
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

export abstract class PricingPublicApi {
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
