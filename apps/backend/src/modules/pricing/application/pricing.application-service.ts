import { Injectable, NotFoundException } from '@nestjs/common';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { RuleApplicationContext } from '../domain/types/pricing-rule.types';
import { CalculateBundlePriceDto, CalculateProductPriceDto, PricingPublicApi } from '../pricing.public-api';
import { PricingCalculator, PricingResult } from '../domain/services/pricing-calculator';
import { PricingQueryService } from '../infrastructure/services/pricing-query.service';

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
}
