import { Module } from '@nestjs/common';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingPublicApi } from './pricing.public-api';
import { PricingQueryService } from './infrastructure/services/pricing-query.service';
import { TenantModule } from '../tenant/tenant.module';
import { CalculateCartPricesQueryHandler } from './application/queries/calculate-cart-prices/calculate-cart-prices.query-handler';
import { PricingController } from './infrastructure/controllers/pricing.controller';

@Module({
  imports: [TenantModule],
  controllers: [PricingController],
  providers: [
    PricingQueryService,
    { provide: PricingPublicApi, useClass: PricingApplicationService },
    CalculateCartPricesQueryHandler,
  ],
  exports: [PricingPublicApi],
})
export class PricingModule {}
