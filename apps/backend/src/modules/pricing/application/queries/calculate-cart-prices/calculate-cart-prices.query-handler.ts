import { TenantConfig } from '@repo/schemas';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { PricingAdjustmentSourceKind, PromotionAdjustmentType } from '@repo/types';
import { err, ok, Result } from 'neverthrow';
import { InsuranceCalculationService } from 'src/core/domain/services/insurance-calculation.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';
import {
  GetLocationContextQuery,
  LocationContextReadModel,
} from 'src/modules/tenant/public/queries/get-location-context.query';
import { CouponNotFoundError, CouponValidationError, PricingPublicApi } from '../../../pricing.public-api';
import { CalculateCartPricesQuery } from './calculate-cart-prices.query';
import {
  PricingBundleNotFoundError,
  PricingInvalidBookingLocationError,
  PricingPeriodInvalidError,
  PricingProductTypeNotFoundError,
} from '../../../domain/errors/pricing.errors';

export type CartPriceResult = {
  lineItems: CartPriceLineItem[];
  totalUnits: number;
  itemsSubtotal: number;
  insuranceApplied: boolean;
  insuranceAmount: number;
  total: number;
  totalBeforeDiscounts: number;
  totalDiscount: number;
  couponApplied: boolean;
};

export type CartPriceLineItem = {
  type: 'PRODUCT' | 'BUNDLE';
  id: string;
  quantity: number;
  pricePerBillingUnit: number;
  subtotal: number;
  discounts: CartDiscountLineItem[];
};

export type CartDiscountLineItem = {
  sourceKind: 'PROMOTION';
  sourceId: string;
  label: string;
  promotionId: string;
  promotionLabel: string;
  type: PromotionAdjustmentType;
  value: number;
  discountAmount: number;
};

export type CalculateCartPricesError =
  | PricingPeriodInvalidError
  | PricingInvalidBookingLocationError
  | PricingProductTypeNotFoundError
  | PricingBundleNotFoundError
  | CouponNotFoundError
  | CouponValidationError
  | ProductTypeInactiveForBookingError
  | BundleInactiveForBookingError
  | ProductTypeNotBookableAtLocationError
  | BundleNotBookableAtLocationError;

@Injectable()
@QueryHandler(CalculateCartPricesQuery)
export class CalculateCartPricesQueryHandler implements IQueryHandler<
  CalculateCartPricesQuery,
  Result<CartPriceResult, CalculateCartPricesError>
> {
  constructor(
    private readonly pricingApp: PricingPublicApi,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: CalculateCartPricesQuery): Promise<Result<CartPriceResult, CalculateCartPricesError>> {
    if (query.items.length === 0) {
      const insuranceTerms = InsuranceCalculationService.resolveTerms(
        {
          insuranceEnabled: false,
          insuranceRatePercent: 0,
        },
        query.insuranceSelected,
      );

      return ok({
        lineItems: [],
        totalUnits: 0,
        itemsSubtotal: 0,
        insuranceApplied: insuranceTerms.insuranceSelected,
        insuranceAmount: 0,
        total: 0,
        totalBeforeDiscounts: 0,
        totalDiscount: 0,
        couponApplied: false,
      });
    }

    const [location, tenantConfig] = await Promise.all([
      this.queryBus.execute<GetLocationContextQuery, LocationContextReadModel | null>(
        new GetLocationContextQuery(query.tenantId, query.locationId),
      ),
      this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(new GetTenantConfigQuery(query.tenantId)),
    ]);

    if (!location) {
      return err(new PricingInvalidBookingLocationError(query.locationId));
    }

    if (!tenantConfig) {
      throw new Error(`Tenant config not found for tenant "${query.tenantId}"`);
    }

    let period: DateRange;

    try {
      period =
        query.pickupTime !== undefined && query.returnTime !== undefined
          ? DateRange.fromLocalDateKeySlots(
              query.pickupDate,
              query.pickupTime,
              query.returnDate,
              query.returnTime,
              location.effectiveTimezone,
            )
          : DateRange.fromLocalDateKeys(query.pickupDate, query.returnDate, location.effectiveTimezone);
    } catch {
      return err(new PricingPeriodInvalidError());
    }

    try {
      const pricedBasket = await this.pricingApp.priceBasket({
        tenantId: query.tenantId,
        locationId: query.locationId,
        currency: query.currency,
        period,
        customerId: query.customerId,
        couponCode: query.couponCode,
        items: query.items,
      });

      const lineItems: CartPriceLineItem[] = pricedBasket.items.map((item) => ({
        type: item.type,
        id: item.type === 'PRODUCT' ? item.productTypeId : item.bundleId,
        quantity: item.quantity,
        pricePerBillingUnit: item.price.pricePerBillingUnit.toDecimal().toNumber(),
        subtotal: item.price.finalPrice.toDecimal().mul(item.quantity).toNumber(),
        discounts: item.price.appliedAdjustments
          .filter((adjustment) => adjustment.sourceKind === PricingAdjustmentSourceKind.PROMOTION)
          .map((adjustment) => ({
            sourceKind: PricingAdjustmentSourceKind.PROMOTION,
            sourceId: adjustment.sourceId,
            label: adjustment.label,
            promotionId: adjustment.sourceId,
            promotionLabel: adjustment.label,
            type: adjustment.effectType,
            value: adjustment.configuredValue,
            discountAmount: adjustment.discountAmount.toDecimal().mul(item.quantity).toNumber(),
          })),
      }));

      const insuranceTerms = InsuranceCalculationService.resolveTerms(
        {
          insuranceEnabled: tenantConfig.pricing.insuranceEnabled,
          insuranceRatePercent: tenantConfig.pricing.insuranceRatePercent,
        },
        query.insuranceSelected,
      );
      const insurance = InsuranceCalculationService.calculate(pricedBasket.totalBeforeDiscounts, insuranceTerms);

      return ok({
        lineItems,
        totalUnits: pricedBasket.items[0]?.price.totalUnits ?? 0,
        itemsSubtotal: pricedBasket.itemsSubtotal,
        insuranceApplied: insurance.insuranceApplied,
        insuranceAmount: insurance.insuranceAmount.toNumber(),
        total: pricedBasket.itemsSubtotal + insurance.insuranceAmount.toNumber(),
        totalBeforeDiscounts: pricedBasket.totalBeforeDiscounts,
        totalDiscount: pricedBasket.totalDiscount,
        couponApplied: pricedBasket.couponApplied,
      });
    } catch (error) {
      if (
        error instanceof CouponNotFoundError ||
        error instanceof CouponValidationError ||
        error instanceof PricingProductTypeNotFoundError ||
        error instanceof PricingBundleNotFoundError ||
        error instanceof ProductTypeInactiveForBookingError ||
        error instanceof BundleInactiveForBookingError ||
        error instanceof ProductTypeNotBookableAtLocationError ||
        error instanceof BundleNotBookableAtLocationError
      ) {
        return err(error);
      }

      throw error;
    }
  }
}
