import Decimal from 'decimal.js';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { TenantConfig } from '@repo/schemas';
import { PricingRuleEffectType } from '@repo/types';
import { err, ok, Result } from 'neverthrow';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import {
  GetLocationContextQuery,
  LocationContextReadModel,
} from 'src/modules/tenant/public/queries/get-location-context.query';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';
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
  ruleId: string;
  ruleLabel: string;
  type: PricingRuleEffectType;
  value: number;
  discountAmount: number;
};

const EQUIPMENT_INSURANCE_RATE = new Decimal('0.06');

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
      return ok({
        lineItems: [],
        totalUnits: 0,
        itemsSubtotal: 0,
        insuranceApplied: query.insuranceSelected,
        insuranceAmount: 0,
        total: 0,
        totalBeforeDiscounts: 0,
        totalDiscount: 0,
        couponApplied: false,
      });
    }

    const location = await this.queryBus.execute<GetLocationContextQuery, LocationContextReadModel | null>(
      new GetLocationContextQuery(query.tenantId, query.locationId),
    );

    if (!location) {
      return err(new PricingInvalidBookingLocationError(query.locationId));
    }

    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(query.tenantId),
    );

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
              tenantConfig.timezone,
            )
          : DateRange.fromLocalDateKeys(query.pickupDate, query.returnDate, tenantConfig.timezone);
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
        discounts: item.price.appliedAdjustments.map((adjustment) => ({
          sourceKind: adjustment.sourceKind,
          sourceId: adjustment.sourceId,
          label: adjustment.label,
          ruleId: adjustment.sourceId,
          ruleLabel: adjustment.label,
          type: adjustment.effectType,
          value: adjustment.configuredValue,
          discountAmount: adjustment.discountAmount.toDecimal().mul(item.quantity).toNumber(),
        })),
      }));

      const insuranceAmount = query.insuranceSelected
        ? new Decimal(pricedBasket.totalBeforeDiscounts).mul(EQUIPMENT_INSURANCE_RATE).toNumber()
        : 0;

      return ok({
        lineItems,
        totalUnits: pricedBasket.items[0]?.price.totalUnits ?? 0,
        itemsSubtotal: pricedBasket.itemsSubtotal,
        insuranceApplied: query.insuranceSelected,
        insuranceAmount,
        total: new Decimal(pricedBasket.itemsSubtotal).plus(insuranceAmount).toNumber(),
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
