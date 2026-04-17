import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { TenantModule } from '../tenant/tenant.module';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingPublicApi } from './pricing.public-api';
import { CreateCouponHttpController } from './application/commands/create-coupon/create-coupon.http.controller';
import { CreateCouponService } from './application/commands/create-coupon/create-coupon.service';
import { CreatePromotionHttpController } from './application/commands/create-promotion/create-promotion.http.controller';
import { CreatePromotionService } from './application/commands/create-promotion/create-promotion.service';
import { ActivatePromotionHttpController } from './application/commands/activate-promotion/activate-promotion.http.controller';
import { ActivatePromotionService } from './application/commands/activate-promotion/activate-promotion.service';
import { UpdateCouponHttpController } from './application/commands/update-coupon/update-coupon.http.controller';
import { UpdateCouponService } from './application/commands/update-coupon/update-coupon.service';
import { ActivateCouponHttpController } from './application/commands/activate-coupon/activate-coupon.http.controller';
import { ActivateCouponService } from './application/commands/activate-coupon/activate-coupon.service';
import { DeactivateCouponHttpController } from './application/commands/deactivate-coupon/deactivate-coupon.http.controller';
import { DeactivateCouponService } from './application/commands/deactivate-coupon/deactivate-coupon.service';
import { DeactivatePromotionHttpController } from './application/commands/deactivate-promotion/deactivate-promotion.http.controller';
import { DeactivatePromotionService } from './application/commands/deactivate-promotion/deactivate-promotion.service';
import { DeleteCouponHttpController } from './application/commands/delete-coupon/delete-coupon.http.controller';
import { DeleteCouponService } from './application/commands/delete-coupon/delete-coupon.service';
import { DeletePromotionHttpController } from './application/commands/delete-promotion/delete-promotion.http.controller';
import { DeletePromotionService } from './application/commands/delete-promotion/delete-promotion.service';
import { SetPricingTiersHttpController } from './application/commands/set-pricing-tiers/set-pricing-tiers.http.controller';
import { SetPricingTiersService } from './application/commands/set-pricing-tiers/set-pricing-tiers.service';
import { UpdatePromotionHttpController } from './application/commands/update-promotion/update-promotion.http.controller';
import { UpdatePromotionService } from './application/commands/update-promotion/update-promotion.service';
import { CalculateCartPricesHttpController } from './application/queries/calculate-cart-prices/calculate-cart-prices.http.controller';
import { CalculateCartPricesQueryHandler } from './application/queries/calculate-cart-prices/calculate-cart-prices.query-handler';
import { GetPromotionByIdHttpController } from './application/queries/get-promotion-by-id/get-promotion-by-id.http.controller';
import { GetPromotionByIdQueryHandler } from './application/queries/get-promotion-by-id/get-promotion-by-id.query-handler';
import { ListCouponsHttpController } from './application/queries/list-coupons/list-coupons.http.controller';
import { ListCouponsHandler } from './application/queries/list-coupons/list-coupons.query-handler';
import { ListPromotionsHttpController } from './application/queries/list-promotions/list-promotions.http.controller';
import { ListPromotionsHandler } from './application/queries/list-promotions/list-promotions.query-handler';
import { RedeemCouponService } from './application/services/redeem-coupon.service';
import { ResolveCouponForPricingService } from './application/services/resolve-coupon-for-pricing.service';
import { ValidateCouponAccessService } from './application/services/validate-coupon-access.service';
import { VoidCouponRedemptionService } from './application/services/void-coupon-redemption.service';
import { PricingComputationReadService } from './infrastructure/read-services/pricing-computation-read.service';
import { CouponRedemptionRepository } from './infrastructure/repositories/coupon-redemption.repository';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { PricingConfigurationRepository } from './infrastructure/repositories/pricing-config.repository';
import { PromotionRepository } from './infrastructure/repositories/promotion.repository';

@Module({
  imports: [CatalogModule, TenantModule],
  controllers: [
    CreateCouponHttpController,
    CreatePromotionHttpController,
    ActivatePromotionHttpController,
    UpdateCouponHttpController,
    ActivateCouponHttpController,
    DeactivateCouponHttpController,
    DeactivatePromotionHttpController,
    DeleteCouponHttpController,
    DeletePromotionHttpController,
    SetPricingTiersHttpController,
    UpdatePromotionHttpController,
    CalculateCartPricesHttpController,
    GetPromotionByIdHttpController,
    ListCouponsHttpController,
    ListPromotionsHttpController,
  ],
  providers: [
    PricingConfigurationRepository,
    PromotionRepository,
    CouponRepository,
    CouponRedemptionRepository,
    PricingComputationReadService,
    ValidateCouponAccessService,
    ResolveCouponForPricingService,
    RedeemCouponService,
    VoidCouponRedemptionService,
    { provide: PricingPublicApi, useClass: PricingApplicationService },
    SetPricingTiersService,
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
    CalculateCartPricesQueryHandler,
    ListCouponsHandler,
    ListPromotionsHandler,
    GetPromotionByIdQueryHandler,
  ],
  exports: [PricingPublicApi, ResolveCouponForPricingService, RedeemCouponService, VoidCouponRedemptionService],
})
export class PricingModule {}
