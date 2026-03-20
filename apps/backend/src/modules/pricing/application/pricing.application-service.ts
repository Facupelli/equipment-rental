import { Injectable, NotFoundException } from '@nestjs/common';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { RuleApplicationContext } from '../domain/types/pricing-rule.types';
import {
  CalculateBundlePriceDto,
  CalculateProductPriceDto,
  GetComponentStandalonePricesDto,
  PricingPublicApi,
} from '../pricing.public-api';
import { PricingCalculator, PricingResult } from '../domain/services/pricing-calculator';
import { PricingQueryService } from '../infrastructure/services/pricing-query.service';
import Decimal from 'decimal.js';

@Injectable()
export class PricingApplicationService implements PricingPublicApi {
  // PricingCalculator is a pure domain service — instantiated directly,
  // no dependency injection needed.
  private readonly calculator = new PricingCalculator();

  constructor(private readonly pricingQuery: PricingQueryService) {}

  async calculateProductPrice(dto: CalculateProductPriceDto): Promise<PricingResult> {
    const meta = await this.pricingQuery.loadProductTypeMeta(dto.productTypeId);
    if (!meta) {
      throw new NotFoundException(`ProductType "${dto.productTypeId}" not found.`);
    }

    const [tiers, rules] = await Promise.all([
      this.pricingQuery.loadTiersForProduct(dto.productTypeId, dto.locationId),
      this.pricingQuery.loadActiveRulesForTenant(dto.tenantId),
    ]);

    const period = DateRange.create(dto.period.start, dto.period.end);

    const context: RuleApplicationContext = {
      period,
      productTypeId: dto.productTypeId,
      categoryId: meta.categoryId ?? undefined,
      orderItemCountByCategory: dto.orderItemCountByCategory,
      customerId: dto.customerId,
      applicableCouponRuleIds: dto.applicableCouponRuleIds,
    };

    return this.calculator.calculate({
      period,
      billingUnitDurationMinutes: meta.billingUnitDurationMinutes,
      tiers,
      rules,
      context,
      currency: dto.currency,
      entityId: dto.productTypeId,
    });
  }

  async calculateBundlePrice(dto: CalculateBundlePriceDto): Promise<PricingResult> {
    const meta = await this.pricingQuery.loadBundleMeta(dto.bundleId);
    if (!meta) {
      throw new NotFoundException(`Bundle "${dto.bundleId}" not found.`);
    }

    const [tiers, rules] = await Promise.all([
      this.pricingQuery.loadTiersForBundle(dto.bundleId, dto.locationId),
      this.pricingQuery.loadActiveRulesForTenant(dto.tenantId),
    ]);

    const period = DateRange.create(dto.period.start, dto.period.end);

    const context: RuleApplicationContext = {
      period,
      bundleId: dto.bundleId,
      orderItemCountByCategory: dto.orderItemCountByCategory,
      customerId: dto.customerId,
      applicableCouponRuleIds: dto.applicableCouponRuleIds,
    };

    return this.calculator.calculate({
      period,
      billingUnitDurationMinutes: meta.billingUnitDurationMinutes,
      tiers,
      rules,
      context,
      currency: dto.currency,
      entityId: dto.bundleId,
    });
  }

  async getComponentStandalonePrices(dto: GetComponentStandalonePricesDto): Promise<Map<string, Decimal>> {
    const componentData = await this.pricingQuery.loadTiersForBundleComponents(
      dto.componentProductTypeIds,
      dto.locationId,
    );

    const result = new Map<string, Decimal>();

    for (const [productTypeId, { billingUnitDurationMinutes, tiers }] of componentData) {
      // Resolve units using the component's own billing unit duration —
      // components may have different billing units than the bundle itself.
      const units = Math.ceil(
        DateRange.create(dto.period.start, dto.period.end).durationInMinutes() / billingUnitDurationMinutes,
      );

      // Find the tier that covers this unit count.
      // If no tier is configured for this component at this location,
      // we cannot compute a meaningful weight — throw so misconfiguration
      // is caught at order creation time rather than silently producing
      // wrong attribution amounts.
      const tier = tiers.find((t) => t.coversUnits(units));
      if (!tier) {
        throw new Error(
          `No pricing tier found for component product type "${productTypeId}" ` +
            `at location "${dto.locationId}" for ${units} units. ` +
            `Configure a standalone pricing tier to enable pro-rata owner attribution.`,
        );
      }

      result.set(productTypeId, tier.pricePerUnit);
    }

    return result;
  }
}
