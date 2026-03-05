import { Injectable, NotFoundException } from '@nestjs/common';
import { PricingReadRepositoryPort } from '../domain/ports/pricing-read.port';
import { Money } from 'src/modules/order/domain/value-objects/money.vo';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { RuleApplicationContext } from '../domain/types/pricing-rule.types';
import { CalculateBundlePriceDto, CalculateProductPriceDto, PricingPublicApi } from '../pricing.public-api';
import { PricingCalculator } from '../domain/services/pricing-calculator';

@Injectable()
export class PricingApplicationService implements PricingPublicApi {
  // PricingCalculator is a pure domain service — instantiated directly,
  // no dependency injection needed.
  private readonly calculator = new PricingCalculator();

  constructor(private readonly pricingRepo: PricingReadRepositoryPort) {}

  async calculateProductPrice(dto: CalculateProductPriceDto): Promise<Money> {
    const meta = await this.pricingRepo.loadProductTypeMeta(dto.productTypeId);
    if (!meta) {
      throw new NotFoundException(`ProductType "${dto.productTypeId}" not found.`);
    }

    const [tiers, rules] = await Promise.all([
      this.pricingRepo.loadTiersForProduct(dto.productTypeId, dto.locationId),
      this.pricingRepo.loadActiveRulesForTenant(dto.tenantId),
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

  async calculateBundlePrice(dto: CalculateBundlePriceDto): Promise<Money> {
    const meta = await this.pricingRepo.loadBundleMeta(dto.bundleId);
    if (!meta) {
      throw new NotFoundException(`Bundle "${dto.bundleId}" not found.`);
    }

    const [tiers, rules] = await Promise.all([
      this.pricingRepo.loadTiersForBundle(dto.bundleId, dto.locationId),
      this.pricingRepo.loadActiveRulesForTenant(dto.tenantId),
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
