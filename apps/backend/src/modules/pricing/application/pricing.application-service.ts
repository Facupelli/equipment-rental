import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantConfig } from '@repo/schemas';
import { Result, err, ok } from 'neverthrow';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';
import { RuleApplicationContext } from '../domain/types/pricing-rule.types';
import {
  CalculateBundlePriceDto,
  CalculateProductPriceDto,
  GetComponentStandalonePricesDto,
  PricingPublicApi,
  RedeemCouponDto,
  RedeemCouponError,
  ResolvedCouponDto,
  ResolveCouponForPricingDto,
  ResolveCouponForPricingError,
} from '../pricing.public-api';
import { PricingCalculator, PricingResult } from '../domain/services/pricing-calculator.service';
import { PricingComputationReadService } from '../infrastructure/read-services/pricing-computation-read.service';
import Decimal from 'decimal.js';
import { PricingBundleNotFoundError, PricingProductTypeNotFoundError } from '../domain/errors/pricing.errors';
import { ResolveCouponForPricingService } from './services/resolve-coupon-for-pricing.service';
import { RedeemCouponService } from './services/redeem-coupon.service';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { BillingUnitResolverService } from '../domain/services/billing-unit-resolver.service';

@Injectable()
export class PricingApplicationService implements PricingPublicApi {
  private readonly calculator = new PricingCalculator();
  private readonly billingUnitResolver = new BillingUnitResolverService();

  constructor(
    private readonly queryBus: QueryBus,
    private readonly pricingRead: PricingComputationReadService,
    private readonly resolveCouponForPricingService: ResolveCouponForPricingService,
    private readonly redeemCouponService: RedeemCouponService,
  ) {}

  async calculateProductPrice(dto: CalculateProductPriceDto): Promise<PricingResult> {
    const [meta, rules, tenantPricingContext, tiers] = await Promise.all([
      this.pricingRead.loadProductTypeMeta(dto.productTypeId),
      this.pricingRead.loadActiveRulesForTenant(dto.tenantId),
      this.loadTenantPricingContext(dto.tenantId),
      this.pricingRead.loadTiersForProduct(dto.productTypeId, dto.locationId),
    ]);

    if (!meta) {
      throw new PricingProductTypeNotFoundError(dto.productTypeId);
    }

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
      tenantTimezone: tenantPricingContext.timezone,
      weekendCountsAsOne: tenantPricingContext.weekendCountsAsOne,
      tiers,
      rules,
      context,
      currency: dto.currency,
      entityId: dto.productTypeId,
    });
  }

  async calculateBundlePrice(dto: CalculateBundlePriceDto): Promise<PricingResult> {
    const [meta, rules, tenantPricingContext, tiers] = await Promise.all([
      this.pricingRead.loadBundleMeta(dto.bundleId),
      this.pricingRead.loadActiveRulesForTenant(dto.tenantId),
      this.loadTenantPricingContext(dto.tenantId),
      this.pricingRead.loadTiersForBundle(dto.bundleId, dto.locationId),
    ]);

    if (!meta) {
      throw new PricingBundleNotFoundError(dto.bundleId);
    }

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
      tenantTimezone: tenantPricingContext.timezone,
      weekendCountsAsOne: tenantPricingContext.weekendCountsAsOne,
      tiers,
      rules,
      context,
      currency: dto.currency,
      entityId: dto.bundleId,
    });
  }

  async getComponentStandalonePrices(dto: GetComponentStandalonePricesDto): Promise<Map<string, Decimal>> {
    const [componentData, tenantPricingContext] = await Promise.all([
      this.pricingRead.loadTiersForBundleComponents(dto.componentProductTypeIds, dto.locationId),
      this.loadTenantPricingContext(dto.tenantId),
    ]);

    const result = new Map<string, Decimal>();

    for (const [productTypeId, { billingUnitDurationMinutes, tiers }] of componentData) {
      // Resolve units using the component's own billing unit duration —
      // components may have different billing units than the bundle itself.
      const units = this.billingUnitResolver.resolveUnits({
        period: dto.period,
        billingUnitDurationMinutes,
        tenantTimezone: tenantPricingContext.timezone,
        weekendCountsAsOne: tenantPricingContext.weekendCountsAsOne,
      });

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

  private async loadTenantPricingContext(tenantId: string): Promise<{ timezone: string; weekendCountsAsOne: boolean }> {
    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(tenantId),
    );

    if (!tenantConfig) {
      throw new Error(`Tenant config not found for tenant "${tenantId}"`);
    }

    return {
      timezone: tenantConfig.timezone,
      weekendCountsAsOne: tenantConfig.pricing.weekendCountsAsOne,
    };
  }

  async resolveCouponForPricing(
    dto: ResolveCouponForPricingDto,
  ): Promise<Result<ResolvedCouponDto, ResolveCouponForPricingError>> {
    const result = await this.resolveCouponForPricingService.resolveCouponForPricing(dto);

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value);
  }

  async redeemCouponWithinTransaction(
    dto: RedeemCouponDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, RedeemCouponError>> {
    const result = await this.redeemCouponService.redeemWithinTransaction(dto, tx);

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(undefined);
  }
}
