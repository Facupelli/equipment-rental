import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { err, ok, Result } from 'src/core/result';
import { PricingPublicApi } from '../../../pricing.public-api';
import { CalculateCartPricesQuery, CartQueryProductItem } from './calculate-cart-prices.query';
import { PricingComputationReadService } from '../../../infrastructure/read-services/pricing-computation-read.service';
import Decimal from 'decimal.js';
import {
  PricingBundleNotFoundError,
  PricingPeriodInvalidError,
  PricingProductTypeNotFoundError,
} from '../../../domain/errors/pricing.errors';

export type CartDiscountLineItem = {
  ruleId: string;
  ruleLabel: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  discountAmount: number;
};

export type CartPriceLineItem = {
  type: 'PRODUCT' | 'BUNDLE';
  id: string;
  quantity: number;
  pricePerBillingUnit: number;
  subtotal: number;
  discounts: CartDiscountLineItem[];
};

export type CartPriceResult = {
  lineItems: CartPriceLineItem[];
  total: number;
  totalBeforeDiscounts: number;
  totalDiscount: number;
  couponApplied: boolean;
};

export type CalculateCartPricesError =
  | PricingPeriodInvalidError
  | PricingProductTypeNotFoundError
  | PricingBundleNotFoundError;

/**
 * Query handler for cart price preview.
 *
 * This handler is intentionally read-only and has no side effects.
 * It is the narrow pricing-query exception to the default Prisma-only read rule:
 * the handler still performs computation by calling the pricing facade because
 * cart preview must execute pure pricing domain logic with no side effects.
 */
@Injectable()
@QueryHandler(CalculateCartPricesQuery)
export class CalculateCartPricesQueryHandler implements IQueryHandler<
  CalculateCartPricesQuery,
  Result<CartPriceResult, CalculateCartPricesError>
> {
  constructor(
    private readonly pricingApp: PricingPublicApi,
    private readonly pricingRead: PricingComputationReadService,
  ) {}

  async execute(query: CalculateCartPricesQuery): Promise<Result<CartPriceResult, CalculateCartPricesError>> {
    // ── Step 1: Guard empty cart ───────────────────────────────────────────
    if (query.items.length === 0) {
      return ok({
        lineItems: [],
        total: 0,
        totalBeforeDiscounts: 0,
        totalDiscount: 0,
        couponApplied: false,
      });
    }

    // ── Step 2: Validate period ────────────────────────────────────────────
    // DateRange.create throws InvalidRentalPeriodException for end <= start.
    // That is a domain invariant violation (catalog/config error) when it
    // originates internally, but here it originates from untrusted client
    // input — so we translate it to a 400.
    try {
      DateRange.create(query.period.start, query.period.end);
    } catch {
      return err(new PricingPeriodInvalidError());
    }

    // ── Step 3: Batch load product type meta ───────────────────────────────
    const productItems = query.items.filter((item): item is CartQueryProductItem => item.type === 'PRODUCT');

    const uniqueProductTypeIds = [...new Set(productItems.map((i) => i.productTypeId))];

    const metaMap =
      uniqueProductTypeIds.length > 0
        ? await this.pricingRead.loadProductTypeMetaBatch(uniqueProductTypeIds)
        : new Map<string, { billingUnitDurationMinutes: number; categoryId: string | null }>();

    // Verify all requested product types exist
    for (const id of uniqueProductTypeIds) {
      if (!metaMap.has(id)) {
        return err(new PricingProductTypeNotFoundError(id));
      }
    }

    // ── Step 4: Build orderItemCountByCategory ─────────────────────────────
    // Reflects total unit count per category across the full cart.
    // Product types with no categoryId are excluded — they have no category
    // context for VOLUME rule evaluation.
    const orderItemCountByCategory: Record<string, number> = {};

    for (const item of productItems) {
      const meta = metaMap.get(item.productTypeId)!;
      if (meta.categoryId) {
        orderItemCountByCategory[meta.categoryId] = (orderItemCountByCategory[meta.categoryId] ?? 0) + item.quantity;
      }
    }

    // ── Step 5: Resolve coupon (NEW) ─────────────────────────────────────────
    // Read-only resolution — no redemption recorded, no transaction needed.
    // Failure is silent in the cart: if the code is invalid, we still return
    // prices but with couponApplied: false. The API layer should validate the
    // code explicitly on a dedicated endpoint if you want inline error messages.
    // let applicableCouponRuleIds: string[] | undefined;
    const couponApplied = false;

    // if (query.couponCode) {
    //   try {
    //     const resolved = await this.couponService.resolveCouponForPricing({
    //       tenantId: query.tenantId,
    //       code: query.couponCode,
    //       customerId: query.customerId,
    //       now: new Date(),
    //     });
    //     applicableCouponRuleIds = [resolved.ruleId];
    //     couponApplied = true;
    //   } catch {
    //     // Invalid or expired coupon — prices return without discount.
    //     // couponApplied stays false.
    //   }
    // }

    // ── Step 6: Fire all pricing calls in parallel ─────────────────────────
    // Each unit is priced independently — this matches how CreateOrderHandler
    // will price each OrderItem at order creation time.
    const { tenantId, locationId, currency, period } = query;

    const pricingTasks = query.items.flatMap((item) =>
      Array.from({ length: item.quantity }, () =>
        item.type === 'PRODUCT'
          ? this.pricingApp.calculateProductPrice({
              tenantId,
              locationId,
              currency,
              period,
              productTypeId: item.productTypeId,
              orderItemCountByCategory,
            })
          : this.pricingApp.calculateBundlePrice({
              tenantId,
              locationId,
              currency,
              period,
              bundleId: item.bundleId,
              orderItemCountByCategory,
            }),
      ),
    );

    let allPrices;

    try {
      allPrices = await Promise.all(pricingTasks);
    } catch (error) {
      if (error instanceof PricingProductTypeNotFoundError || error instanceof PricingBundleNotFoundError) {
        return err(error);
      }

      throw error;
    }

    // ── Step 6: Reassemble line items ──────────────────────────────────────
    // Walk items in order, slicing allPrices by quantity to group results
    // back per line. Cursor tracks position across the flat prices array.
    let cursor = 0;
    const lineItems: CartPriceLineItem[] = query.items.map((item) => {
      const unitPrices = allPrices.slice(cursor, cursor + item.quantity);
      cursor += item.quantity;

      const pricePerBillingUnit = unitPrices[0].pricePerBillingUnit;
      const subtotal = unitPrices.reduce((acc, r) => acc.add(r.finalPrice), Money.zero(query.currency));

      // Merge discounts across units of the same line item.
      // Units share the same inputs so they produce identical discount sets —
      // we take index 0 as canonical and multiply amounts by quantity.
      const discounts: CartDiscountLineItem[] = unitPrices[0].appliedDiscounts.map((d) => ({
        ruleId: d.ruleId,
        ruleLabel: d.ruleLabel,
        type: d.type,
        value: d.value,
        discountAmount: d.discountAmount.multiply(new Decimal(item.quantity)).toDecimal().toNumber(),
      }));

      return {
        type: item.type,
        id: item.type === 'PRODUCT' ? item.productTypeId : item.bundleId,
        quantity: item.quantity,
        pricePerBillingUnit: pricePerBillingUnit.toDecimal().toNumber(),
        subtotal: subtotal.toDecimal().toNumber(),
        discounts,
      };
    });

    // ── Step 8: Compute total ──────────────────────────────────────────────
    const total = lineItems.reduce((acc, line) => acc + line.subtotal, 0);

    const totalBeforeDiscounts = allPrices
      .reduce((acc, r) => acc.add(r.basePrice), Money.zero(query.currency))
      .toDecimal()
      .toNumber();

    const totalDiscount = allPrices
      .reduce((acc, r) => r.appliedDiscounts.reduce((s, d) => s.add(d.discountAmount), acc), Money.zero(query.currency))
      .toDecimal()
      .toNumber();

    return ok({
      lineItems,
      total,
      totalBeforeDiscounts,
      totalDiscount,
      couponApplied,
    });
  }
}
