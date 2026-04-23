import Decimal from 'decimal.js';
import { Result } from 'neverthrow';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { CouponNotFoundError, CouponValidationError } from './domain/errors/pricing.errors';

export type PriceBasketProductItemDto = {
  type: 'PRODUCT';
  productTypeId: string;
  quantity?: number;
  assetId?: string;
};

export type PriceBasketBundleItemDto = {
  type: 'BUNDLE';
  bundleId: string;
  quantity?: number;
};

export type PriceBasketItemDto = PriceBasketProductItemDto | PriceBasketBundleItemDto;

export type PriceBasketDto = {
  tenantId: string;
  locationId: string;
  period: { start: Date; end: Date } | DateRange;
  currency: string;
  customerId?: string;
  bookingCreatedAt?: Date;
  couponCode?: string;
  items: PriceBasketItemDto[];
};

export type PricedBasketBundleComponentDto = {
  productTypeId: string;
  productTypeName: string;
  quantity: number;
  standalonePricePerUnit: Decimal;
};

export type PricedBasketProductLineDto = {
  type: 'PRODUCT';
  productTypeId: string;
  quantity: number;
  assetId?: string;
  locationId: string;
  period: DateRange;
  currency: string;
  price: import('./domain/services/new-pricing-calculator.service').NewPricingResult;
};

export type PricedBasketBundleLineDto = {
  type: 'BUNDLE';
  bundleId: string;
  quantity: number;
  locationId: string;
  period: DateRange;
  currency: string;
  price: import('./domain/services/new-pricing-calculator.service').NewPricingResult;
  bundleName: string;
  components: PricedBasketBundleComponentDto[];
};

export type PricedBasketLineDto = PricedBasketProductLineDto | PricedBasketBundleLineDto;

export type PriceBasketResultDto = {
  items: PricedBasketLineDto[];
  resolvedCoupon?: ResolvedCouponDto;
  couponApplied: boolean;
  orderSubtotalBeforePromotions: number;
  itemsSubtotal: number;
  totalBeforeDiscounts: number;
  totalDiscount: number;
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
  abstract priceBasket(dto: PriceBasketDto): Promise<PriceBasketResultDto>;
  abstract resolveCouponForPricing(
    dto: ResolveCouponForPricingDto,
  ): Promise<Result<ResolvedCouponDto, ResolveCouponForPricingError>>;
  abstract redeemCouponWithinTransaction(
    dto: RedeemCouponDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, RedeemCouponError>>;
  abstract voidCouponRedemptionWithinTransaction(orderId: string, tx: PrismaTransactionClient): Promise<void>;
}
