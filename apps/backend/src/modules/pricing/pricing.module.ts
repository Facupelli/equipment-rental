import { Module } from '@nestjs/common';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingPublicApi } from './pricing.public-api';
import { CalculateCartPricesQueryHandler } from './application/queries/calculate-cart-prices/calculate-cart-prices.query-handler';
import { PricingConfigurationRepository } from './infrastructure/repositories/pricing-config.repository';
import { CatalogModule } from '../catalog/catalog.module';
import { TenantModule } from '../tenant/tenant.module';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { CouponRedemptionRepository } from './infrastructure/repositories/coupon-redemption.repository';
import { LongRentalDiscountRepository } from './infrastructure/repositories/long-rental-discount.repository';
import { PricingRuleRepository } from './infrastructure/repositories/pricing-rule.repository';
import { PromotionRepository } from './infrastructure/repositories/promotion.repository';
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
import { ActivateLongRentalDiscountHttpController } from './application/commands/activate-long-rental-discount/activate-long-rental-discount.http.controller';
import { ActivateLongRentalDiscountService } from './application/commands/activate-long-rental-discount/activate-long-rental-discount.service';
import { ActivatePromotionHttpController } from './application/commands/activate-promotion/activate-promotion.http.controller';
import { ActivatePromotionService } from './application/commands/activate-promotion/activate-promotion.service';
import { UpdateCouponHttpController } from './application/commands/update-coupon/update-coupon.http.controller';
import { UpdateCouponService } from './application/commands/update-coupon/update-coupon.service';
import { ActivateCouponHttpController } from './application/commands/activate-coupon/activate-coupon.http.controller';
import { ActivateCouponService } from './application/commands/activate-coupon/activate-coupon.service';
import { DeactivateCouponHttpController } from './application/commands/deactivate-coupon/deactivate-coupon.http.controller';
import { DeactivateCouponService } from './application/commands/deactivate-coupon/deactivate-coupon.service';
import { CreateLongRentalDiscountHttpController } from './application/commands/create-long-rental-discount/create-long-rental-discount.http.controller';
import { CreateLongRentalDiscountService } from './application/commands/create-long-rental-discount/create-long-rental-discount.service';
import { CreatePromotionHttpController } from './application/commands/create-promotion/create-promotion.http.controller';
import { CreatePromotionService } from './application/commands/create-promotion/create-promotion.service';
import { DeactivateLongRentalDiscountHttpController } from './application/commands/deactivate-long-rental-discount/deactivate-long-rental-discount.http.controller';
import { DeactivateLongRentalDiscountService } from './application/commands/deactivate-long-rental-discount/deactivate-long-rental-discount.service';
import { DeactivatePromotionHttpController } from './application/commands/deactivate-promotion/deactivate-promotion.http.controller';
import { DeactivatePromotionService } from './application/commands/deactivate-promotion/deactivate-promotion.service';
import { DeleteCouponHttpController } from './application/commands/delete-coupon/delete-coupon.http.controller';
import { DeleteCouponService } from './application/commands/delete-coupon/delete-coupon.service';
import { DeleteLongRentalDiscountHttpController } from './application/commands/delete-long-rental-discount/delete-long-rental-discount.http.controller';
import { DeleteLongRentalDiscountService } from './application/commands/delete-long-rental-discount/delete-long-rental-discount.service';
import { DeletePromotionHttpController } from './application/commands/delete-promotion/delete-promotion.http.controller';
import { DeletePromotionService } from './application/commands/delete-promotion/delete-promotion.service';
import { SetPricingTiersHttpController } from './application/commands/set-pricing-tiers/set-pricing-tiers.http.controller';
import { SetPricingTiersService } from './application/commands/set-pricing-tiers/set-pricing-tiers.service';
import { UpdateLongRentalDiscountHttpController } from './application/commands/update-long-rental-discount/update-long-rental-discount.http.controller';
import { UpdateLongRentalDiscountService } from './application/commands/update-long-rental-discount/update-long-rental-discount.service';
import { UpdatePromotionHttpController } from './application/commands/update-promotion/update-promotion.http.controller';
import { UpdatePromotionService } from './application/commands/update-promotion/update-promotion.service';
import { ListPricingRulesHandler } from './application/queries/list-pricing-rules/list-pricing-rules.query-handler';
import { ListPricingRulesHttpController } from './application/queries/list-pricing-rules/list-pricing-rules.http.controller';
import { ListCouponsHandler } from './application/queries/list-coupons/list-coupons.query-handler';
import { ListCouponsHttpController } from './application/queries/list-coupons/list-coupons.http.controller';
import { CalculateCartPricesHttpController } from './application/queries/calculate-cart-prices/calculate-cart-prices.http.controller';
import { GetLongRentalDiscountByIdHttpController } from './application/queries/get-long-rental-discount-by-id/get-long-rental-discount-by-id.http.controller';
import { GetLongRentalDiscountByIdQueryHandler } from './application/queries/get-long-rental-discount-by-id/get-long-rental-discount-by-id.query-handler';
import { GetPromotionByIdHttpController } from './application/queries/get-promotion-by-id/get-promotion-by-id.http.controller';
import { GetPromotionByIdQueryHandler } from './application/queries/get-promotion-by-id/get-promotion-by-id.query-handler';
import { ListLongRentalDiscountsHttpController } from './application/queries/list-long-rental-discounts/list-long-rental-discounts.http.controller';
import { ListLongRentalDiscountsHandler } from './application/queries/list-long-rental-discounts/list-long-rental-discounts.query-handler';
import { ListPromotionsHttpController } from './application/queries/list-promotions/list-promotions.http.controller';
import { ListPromotionsHandler } from './application/queries/list-promotions/list-promotions.query-handler';
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
    CreateLongRentalDiscountHttpController,
    UpdateLongRentalDiscountHttpController,
    ActivateLongRentalDiscountHttpController,
    DeactivateLongRentalDiscountHttpController,
    DeleteLongRentalDiscountHttpController,
    CreatePromotionHttpController,
    UpdatePromotionHttpController,
    ActivatePromotionHttpController,
    DeactivatePromotionHttpController,
    DeletePromotionHttpController,
    UpdateCouponHttpController,
    ActivateCouponHttpController,
    DeactivateCouponHttpController,
    DeleteCouponHttpController,
    ListCouponsHttpController,
    SetPricingTiersHttpController,
    CalculateCartPricesHttpController,
    ListLongRentalDiscountsHttpController,
    GetLongRentalDiscountByIdHttpController,
    ListPromotionsHttpController,
    GetPromotionByIdHttpController,
  ],
  providers: [
    PricingConfigurationRepository,
    PricingRuleRepository,
    LongRentalDiscountRepository,
    PromotionRepository,
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
    CreateLongRentalDiscountService,
    UpdateLongRentalDiscountService,
    ActivateLongRentalDiscountService,
    DeactivateLongRentalDiscountService,
    DeleteLongRentalDiscountService,
    CreatePromotionService,
    UpdatePromotionService,
    ActivatePromotionService,
    DeactivatePromotionService,
    DeletePromotionService,
    CreateCouponService,
    UpdateCouponService,
    ActivateCouponService,
    DeactivateCouponService,
    DeleteCouponService,
    // queries
    CalculateCartPricesQueryHandler,
    ListPricingRulesHandler,
    ListCouponsHandler,
    ListLongRentalDiscountsHandler,
    GetLongRentalDiscountByIdQueryHandler,
    ListPromotionsHandler,
    GetPromotionByIdQueryHandler,
  ],
  exports: [PricingPublicApi, ResolveCouponForPricingService, RedeemCouponService, VoidCouponRedemptionService],
})
export class PricingModule {}
