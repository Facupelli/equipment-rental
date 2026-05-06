import { TenantConfig } from '@repo/schemas';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import Decimal from 'decimal.js';
import { err, ok, Result } from 'neverthrow';
import { InsuranceCalculationService } from 'src/core/domain/services/insurance-calculation.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import { OrderPricingTargetTotalInvalidError } from 'src/modules/order/domain/errors/order.errors';
import { DraftOrderPricingService } from 'src/modules/order/domain/services/draft-order-pricing.service';
import { CouponNotFoundError, CouponValidationError, PricingPublicApi } from 'src/modules/pricing/pricing.public-api';
import {
  PricingBundleNotFoundError,
  PricingInvalidBookingLocationError,
  PricingPeriodInvalidError,
  PricingProductTypeNotFoundError,
} from 'src/modules/pricing/domain/errors/pricing.errors';
import {
  GetLocationContextQuery,
  LocationContextReadModel,
} from 'src/modules/tenant/public/queries/get-location-context.query';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';

import { PreviewOrderPricingQuery } from './preview-order-pricing.query';
import { PreviewOrderPricingResponseDto } from './preview-order-pricing.response.dto';

export type PreviewOrderPricingError =
  | PricingPeriodInvalidError
  | PricingInvalidBookingLocationError
  | PricingProductTypeNotFoundError
  | PricingBundleNotFoundError
  | CouponNotFoundError
  | CouponValidationError
  | ProductTypeInactiveForBookingError
  | BundleInactiveForBookingError
  | ProductTypeNotBookableAtLocationError
  | BundleNotBookableAtLocationError
  | OrderPricingTargetTotalInvalidError;

@QueryHandler(PreviewOrderPricingQuery)
export class PreviewOrderPricingQueryHandler implements IQueryHandler<
  PreviewOrderPricingQuery,
  Result<PreviewOrderPricingResponseDto, PreviewOrderPricingError>
> {
  constructor(
    private readonly pricingApi: PricingPublicApi,
    private readonly queryBus: QueryBus,
    private readonly draftOrderPricingService: DraftOrderPricingService,
  ) {}

  async execute(
    query: PreviewOrderPricingQuery,
  ): Promise<Result<PreviewOrderPricingResponseDto, PreviewOrderPricingError>> {
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
      period = DateRange.fromLocalDateKeySlots(
        query.pickupDate,
        query.pickupTime,
        query.returnDate,
        query.returnTime,
        location.effectiveTimezone,
      );
    } catch {
      return err(new PricingPeriodInvalidError());
    }

    try {
      const pricedBasket = await this.pricingApi.priceBasket({
        tenantId: query.tenantId,
        locationId: query.locationId,
        currency: query.currency,
        customerId: query.customerId ?? undefined,
        period,
        couponCode: query.couponCode,
        items: query.items.map((item) =>
          item.type === 'PRODUCT'
            ? {
                type: 'PRODUCT' as const,
                productTypeId: item.productTypeId,
                quantity: item.quantity,
                assetId: item.assetId,
              }
            : {
                type: 'BUNDLE' as const,
                bundleId: item.bundleId,
              },
        ),
      });

      const insuranceTerms = InsuranceCalculationService.resolveTerms(
        {
          insuranceEnabled: tenantConfig.pricing.insuranceEnabled,
          insuranceRatePercent: tenantConfig.pricing.insuranceRatePercent,
        },
        query.insuranceSelected,
      );
      const insurance = InsuranceCalculationService.calculate(
        new Decimal(pricedBasket.totalBeforeDiscounts),
        insuranceTerms,
      );
      const lineDraftItems = query.items;
      const allocationItems = pricedBasket.items.flatMap((item, lineIndex) => {
        const draftItem = lineDraftItems[lineIndex];
        const quantity = item.quantity;

        return Array.from({ length: quantity }, (_, unitIndex) => ({
          orderItemId: `${draftItem.draftItemId}:${unitIndex}`,
          draftItemId: draftItem.draftItemId,
          currentFinalPrice: item.price.finalPrice.toDecimal(),
        }));
      });
      const finalPriceByAllocationId = query.pricingAdjustment
        ? this.draftOrderPricingService.buildFinalPriceMapFromTargetTotalItems(
            allocationItems,
            new Decimal(query.pricingAdjustment.targetTotal),
          )
        : new Map(allocationItems.map((item) => [item.orderItemId, item.currentFinalPrice]));
      const effectiveSubtotal = allocationItems.reduce((sum, item) => {
        return sum.plus(finalPriceByAllocationId.get(item.orderItemId) ?? item.currentFinalPrice);
      }, new Decimal(0));
      const calculatedSubtotal = new Decimal(pricedBasket.itemsSubtotal);
      const adjustmentDelta = effectiveSubtotal.minus(calculatedSubtotal);
      const insuranceAmount = insurance.insuranceAmount;

      return ok({
        currency: query.currency,
        calculatedSubtotal: calculatedSubtotal.toFixed(2),
        effectiveSubtotal: effectiveSubtotal.toFixed(2),
        targetTotal: query.pricingAdjustment?.targetTotal ?? null,
        adjustmentTotal: adjustmentDelta.abs().toFixed(2),
        adjustmentDirection: toAdjustmentDirection(adjustmentDelta),
        insuranceApplied: insurance.insuranceApplied,
        insuranceAmount: insuranceAmount.toFixed(2),
        total: effectiveSubtotal.plus(insuranceAmount).toFixed(2),
        totalBeforeDiscounts: new Decimal(pricedBasket.totalBeforeDiscounts).toFixed(2),
        totalDiscount: new Decimal(pricedBasket.totalDiscount).toFixed(2),
        couponApplied: pricedBasket.couponApplied,
        lineItems: pricedBasket.items.map((item, lineIndex) => {
          const draftItem = lineDraftItems[lineIndex];
          const quantity = item.quantity;
          const calculatedFinalPrice = item.price.finalPrice.toDecimal().mul(quantity);
          const basePrice = item.price.basePrice.toDecimal().mul(quantity);
          const effectiveFinalPrice = allocationItems
            .filter((allocationItem) => allocationItem.draftItemId === draftItem.draftItemId)
            .reduce((sum, allocationItem) => {
              return sum.plus(
                finalPriceByAllocationId.get(allocationItem.orderItemId) ?? allocationItem.currentFinalPrice,
              );
            }, new Decimal(0));
          const lineAdjustmentDelta = effectiveFinalPrice.minus(calculatedFinalPrice);
          const discountLines = item.price.appliedAdjustments.map((adjustment) => ({
            sourceKind: 'PROMOTION' as const,
            sourceId: adjustment.sourceId,
            label: adjustment.label,
            promotionId: adjustment.sourceId,
            promotionLabel: adjustment.label,
            type: adjustment.effectType,
            value: adjustment.configuredValue,
            discountAmount: adjustment.discountAmount.toDecimal().mul(quantity).toFixed(2),
          }));

          return {
            draftItemId: draftItem.draftItemId,
            type: item.type,
            id: item.type === 'PRODUCT' ? item.productTypeId : item.bundleId,
            label: draftItem.label,
            quantity,
            currency: item.currency,
            basePrice: basePrice.toFixed(2),
            calculatedFinalPrice: calculatedFinalPrice.toFixed(2),
            discountTotal: discountLines
              .reduce((sum, discount) => sum.plus(discount.discountAmount), new Decimal(0))
              .toFixed(2),
            discountLines,
            effectiveFinalPrice: effectiveFinalPrice.toFixed(2),
            adjustmentAmount: lineAdjustmentDelta.abs().toFixed(2),
            adjustmentDirection: toAdjustmentDirection(lineAdjustmentDelta),
            hasAdjustment: !lineAdjustmentDelta.isZero(),
          };
        }),
      });
    } catch (error) {
      if (error instanceof OrderPricingTargetTotalInvalidError) {
        return err(error);
      }

      if (
        error instanceof PricingProductTypeNotFoundError ||
        error instanceof PricingBundleNotFoundError ||
        error instanceof CouponNotFoundError ||
        error instanceof CouponValidationError ||
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

function toAdjustmentDirection(delta: Decimal): 'DISCOUNT' | 'SURCHARGE' | 'NONE' {
  if (delta.lt(0)) {
    return 'DISCOUNT';
  }

  if (delta.gt(0)) {
    return 'SURCHARGE';
  }

  return 'NONE';
}
