import { Module } from '@nestjs/common';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingPublicApi } from './pricing.public-api';
import { PricingQueryService } from './infrastructure/services/pricing-query.service';
import { CalculateCartPricesQueryHandler } from './application/queries/calculate-cart-prices/calculate-cart-prices.query-handler';
import { PricingController } from './infrastructure/controllers/pricing.controller';
import { PricingTierController } from './infrastructure/controllers/pricing-tier.controller';
import { SetPricingTiersCommandHandler } from './application/commands/set-pricing-tier.command-handler';
import { PricingConfigurationRepository } from './infrastructure/repositories/pricing-config.repository';
import { PricingConfigurationRepositoryPort } from './domain/ports/pricing-config.repository.port';
import { CatalogModule } from '../catalog/catalog.module';
import { CouponApplicationService } from './application/coupon.application-service';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { CouponRepositoryPort } from './domain/ports/coupon.repository.port';
import { CouponRedemptionRepository } from './infrastructure/repositories/coupon-redemption.repoistory';

@Module({
  imports: [CatalogModule],
  controllers: [PricingController, PricingTierController],
  providers: [
    { provide: PricingConfigurationRepositoryPort, useClass: PricingConfigurationRepository },
    { provide: CouponRepositoryPort, useClass: CouponRepository },
    CouponRedemptionRepository,
    // services
    PricingQueryService,
    CouponApplicationService,
    { provide: PricingPublicApi, useClass: PricingApplicationService },
    // cqrs
    CalculateCartPricesQueryHandler,
    SetPricingTiersCommandHandler,
  ],
  exports: [
    PricingPublicApi,
    // TODO: handle this cross-module dependency, only used by order module
    CouponApplicationService,
  ],
})
export class PricingModule {}
