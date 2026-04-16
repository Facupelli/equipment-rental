import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantConfig } from '@repo/schemas';
import { RoundingRule } from '@repo/types';
import { err, ok, Result } from 'neverthrow';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';
import { PricingBundleNotFoundError, PricingProductTypeNotFoundError } from '../domain/errors/pricing.errors';
import { BillingUnitResolverService } from '../domain/services/billing-unit-resolver.service';
import { NewPricingCalculatorService, NewPricingResult } from '../domain/services/new-pricing-calculator.service';
import {
  CalculateBundlePriceV2Dto,
  CalculateProductPriceV2Dto,
  GetComponentStandalonePricesDto,
  PricingPublicApi,
  RedeemCouponDto,
  RedeemCouponError,
  ResolvedCouponDto,
  ResolveCouponForPricingDto,
  ResolveCouponForPricingError,
} from '../pricing.public-api';
import { PricingComputationReadService } from '../infrastructure/read-services/pricing-computation-read.service';
import { RedeemCouponService } from './services/redeem-coupon.service';
import { ResolveCouponForPricingService } from './services/resolve-coupon-for-pricing.service';
import Decimal from 'decimal.js';

@Injectable()
export class PricingApplicationService implements PricingPublicApi {
  private readonly calculator = new NewPricingCalculatorService();
  private readonly billingUnitResolver = new BillingUnitResolverService();

  constructor(
    private readonly queryBus: QueryBus,
    private readonly pricingRead: PricingComputationReadService,
    private readonly resolveCouponForPricingService: ResolveCouponForPricingService,
    private readonly redeemCouponService: RedeemCouponService,
  ) {}

  async calculateProductPriceV2(dto: CalculateProductPriceV2Dto): Promise<NewPricingResult> {
    const [meta, promotions, tenantPricingContext, tiers] = await Promise.all([
      this.pricingRead.loadProductTypeMeta(dto.productTypeId),
      this.pricingRead.loadActivePromotionsForTenant(dto.tenantId),
      this.loadTenantPricingContext(dto.tenantId),
      this.pricingRead.loadTiersForProduct(dto.productTypeId, dto.locationId),
    ]);

    if (!meta) {
      throw new PricingProductTypeNotFoundError(dto.productTypeId);
    }

    const period = dto.period instanceof DateRange ? dto.period : DateRange.create(dto.period.start, dto.period.end);

    return this.calculator.calculate({
      period,
      billingUnitDurationMinutes: meta.billingUnitDurationMinutes,
      tenantTimezone: tenantPricingContext.timezone,
      weekendCountsAsOne: tenantPricingContext.weekendCountsAsOne,
      roundingRule: tenantPricingContext.roundingRule,
      tiers,
      promotions,
      context: {
        period,
        bookingCreatedAt: dto.bookingCreatedAt ?? new Date(),
        orderCurrency: dto.currency,
        productTypeId: dto.productTypeId,
        customerId: dto.customerId,
        applicablePromotionIds: dto.applicablePromotionIds,
        standaloneProductQuantityByCategory: dto.standaloneProductQuantityByCategory ?? {},
        orderSubtotalBeforePromotions: dto.orderSubtotalBeforePromotions,
      },
      currency: dto.currency,
      entityId: dto.productTypeId,
      applyPromotions: dto.applyPromotions ?? true,
    });
  }

  async calculateBundlePriceV2(dto: CalculateBundlePriceV2Dto): Promise<NewPricingResult> {
    const [meta, promotions, tenantPricingContext, tiers] = await Promise.all([
      this.pricingRead.loadBundleMeta(dto.bundleId),
      this.pricingRead.loadActivePromotionsForTenant(dto.tenantId),
      this.loadTenantPricingContext(dto.tenantId),
      this.pricingRead.loadTiersForBundle(dto.bundleId, dto.locationId),
    ]);

    if (!meta) {
      throw new PricingBundleNotFoundError(dto.bundleId);
    }

    const period = dto.period instanceof DateRange ? dto.period : DateRange.create(dto.period.start, dto.period.end);

    return this.calculator.calculate({
      period,
      billingUnitDurationMinutes: meta.billingUnitDurationMinutes,
      tenantTimezone: tenantPricingContext.timezone,
      weekendCountsAsOne: tenantPricingContext.weekendCountsAsOne,
      roundingRule: tenantPricingContext.roundingRule,
      tiers,
      promotions,
      context: {
        period,
        bookingCreatedAt: dto.bookingCreatedAt ?? new Date(),
        orderCurrency: dto.currency,
        bundleId: dto.bundleId,
        customerId: dto.customerId,
        applicablePromotionIds: dto.applicablePromotionIds,
        standaloneProductQuantityByCategory: dto.standaloneProductQuantityByCategory ?? {},
        orderSubtotalBeforePromotions: dto.orderSubtotalBeforePromotions,
      },
      currency: dto.currency,
      entityId: dto.bundleId,
      applyPromotions: dto.applyPromotions ?? true,
    });
  }

  async getComponentStandalonePrices(dto: GetComponentStandalonePricesDto): Promise<Map<string, Decimal>> {
    const [componentData, tenantPricingContext] = await Promise.all([
      this.pricingRead.loadTiersForBundleComponents(dto.componentProductTypeIds, dto.locationId),
      this.loadTenantPricingContext(dto.tenantId),
    ]);

    const result = new Map<string, Decimal>();

    for (const [productTypeId, { billingUnitDurationMinutes, tiers }] of componentData) {
      const units = this.billingUnitResolver.resolveUnits({
        period: dto.period,
        billingUnitDurationMinutes,
        tenantTimezone: tenantPricingContext.timezone,
        weekendCountsAsOne: tenantPricingContext.weekendCountsAsOne,
        roundingRule: tenantPricingContext.roundingRule,
      });

      const tier = tiers.find((candidate) => candidate.coversUnits(units));
      if (!tier) {
        throw new Error(
          `No pricing tier found for component product type "${productTypeId}" at location "${dto.locationId}" for ${units} units.`,
        );
      }

      result.set(productTypeId, tier.pricePerUnit);
    }

    return result;
  }

  async resolveCouponForPricing(
    dto: ResolveCouponForPricingDto,
  ): Promise<Result<ResolvedCouponDto, ResolveCouponForPricingError>> {
    const result = await this.resolveCouponForPricingService.resolveCouponForPricing(dto);
    return result.isErr() ? err(result.error) : ok(result.value);
  }

  async redeemCouponWithinTransaction(
    dto: RedeemCouponDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, RedeemCouponError>> {
    const result = await this.redeemCouponService.redeemWithinTransaction(dto, tx);
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  private async loadTenantPricingContext(
    tenantId: string,
  ): Promise<{ timezone: string; weekendCountsAsOne: boolean; roundingRule: RoundingRule }> {
    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(tenantId),
    );

    if (!tenantConfig) {
      throw new Error(`Tenant config not found for tenant "${tenantId}"`);
    }

    return {
      timezone: tenantConfig.timezone,
      weekendCountsAsOne: tenantConfig.pricing.weekendCountsAsOne,
      roundingRule: tenantConfig.pricing.roundingRule,
    };
  }
}
