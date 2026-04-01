import { Module } from '@nestjs/common';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingPublicApi } from './pricing.public-api';
import { CalculateCartPricesQueryHandler } from './application/queries/calculate-cart-prices/calculate-cart-prices.query-handler';
import { PricingConfigurationRepository } from './infrastructure/repositories/pricing-config.repository';
import { CatalogModule } from '../catalog/catalog.module';
import { TenantModule } from '../tenant/tenant.module';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { CouponRedemptionRepository } from './infrastructure/repositories/coupon-redemption.repository';
import { PricingRuleRepository } from './infrastructure/repositories/pricing-rule.repository';
import { ResolveCouponForPricingService } from './application/services/resolve-coupon-for-pricing.service';
import { RedeemCouponService } from './application/services/redeem-coupon.service';
import { VoidCouponRedemptionService } from './application/services/void-coupon-redemption.service';
import { CreatePricingRuleHttpController } from './application/commands/create-pricing-rule/create-pricing-rule.http.controller';
import { CreatePricingRuleService } from './application/commands/create-pricing-rule/create-pricing-rule.service';
import { UpdatePricingRuleHttpController } from './application/commands/update-pricing-rule/update-pricing-rule.http.controller';
import { UpdatePricingRuleService } from './application/commands/update-pricing-rule/update-pricing-rule.service';
import { ActivatePricingRuleHttpController } from './application/commands/activate-pricing-rule/activate-pricing-rule.http.controller';
import { ActivatePricingRuleService } from './application/commands/activate-pricing-rule/activate-pricing-rule.service';
import { DeactivatePricingRuleHttpController } from './application/commands/deactivate-pricing-rule/deactivate-pricing-rule.http.controller';
import { DeactivatePricingRuleService } from './application/commands/deactivate-pricing-rule/deactivate-pricing-rule.service';
import { DeletePricingRuleHttpController } from './application/commands/delete-pricing-rule/delete-pricing-rule.http.controller';
import { DeletePricingRuleService } from './application/commands/delete-pricing-rule/delete-pricing-rule.service';
import { CreateCouponHttpController } from './application/commands/create-coupon/create-coupon.http.controller';
import { CreateCouponService } from './application/commands/create-coupon/create-coupon.service';
import { UpdateCouponHttpController } from './application/commands/update-coupon/update-coupon.http.controller';
import { UpdateCouponService } from './application/commands/update-coupon/update-coupon.service';
import { ActivateCouponHttpController } from './application/commands/activate-coupon/activate-coupon.http.controller';
import { ActivateCouponService } from './application/commands/activate-coupon/activate-coupon.service';
import { DeactivateCouponHttpController } from './application/commands/deactivate-coupon/deactivate-coupon.http.controller';
import { DeactivateCouponService } from './application/commands/deactivate-coupon/deactivate-coupon.service';
import { DeleteCouponHttpController } from './application/commands/delete-coupon/delete-coupon.http.controller';
import { DeleteCouponService } from './application/commands/delete-coupon/delete-coupon.service';
import { SetPricingTiersHttpController } from './application/commands/set-pricing-tiers/set-pricing-tiers.http.controller';
import { SetPricingTiersService } from './application/commands/set-pricing-tiers/set-pricing-tiers.service';
import { ListPricingRulesHandler } from './application/queries/list-pricing-rules/list-pricing-rules.query-handler';
import { ListPricingRulesHttpController } from './application/queries/list-pricing-rules/list-pricing-rules.http.controller';
import { ListCouponsHandler } from './application/queries/list-coupons/list-coupons.query-handler';
import { ListCouponsHttpController } from './application/queries/list-coupons/list-coupons.http.controller';
import { CalculateCartPricesHttpController } from './application/queries/calculate-cart-prices/calculate-cart-prices.http.controller';
import { PricingComputationReadService } from './infrastructure/read-services/pricing-computation-read.service';

@Module({
  imports: [CatalogModule, TenantModule],
  controllers: [
    CreatePricingRuleHttpController,
    UpdatePricingRuleHttpController,
    ActivatePricingRuleHttpController,
    DeactivatePricingRuleHttpController,
    DeletePricingRuleHttpController,
    ListPricingRulesHttpController,
    CreateCouponHttpController,
    UpdateCouponHttpController,
    ActivateCouponHttpController,
    DeactivateCouponHttpController,
    DeleteCouponHttpController,
    ListCouponsHttpController,
    SetPricingTiersHttpController,
    CalculateCartPricesHttpController,
  ],
  providers: [
    PricingConfigurationRepository,
    PricingRuleRepository,
    CouponRepository,
    CouponRedemptionRepository,
    // services
    PricingComputationReadService,
    ResolveCouponForPricingService,
    RedeemCouponService,
    VoidCouponRedemptionService,
    { provide: PricingPublicApi, useClass: PricingApplicationService },
    // commands
    SetPricingTiersService,
    CreatePricingRuleService,
    UpdatePricingRuleService,
    ActivatePricingRuleService,
    DeactivatePricingRuleService,
    DeletePricingRuleService,
    CreateCouponService,
    UpdateCouponService,
    ActivateCouponService,
    DeactivateCouponService,
    DeleteCouponService,
    // queries
    CalculateCartPricesQueryHandler,
    ListPricingRulesHandler,
    ListCouponsHandler,
  ],
  exports: [PricingPublicApi, ResolveCouponForPricingService, RedeemCouponService, VoidCouponRedemptionService],
})
export class PricingModule {}
