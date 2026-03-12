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

@Module({
  imports: [CatalogModule],
  controllers: [PricingController, PricingTierController],
  providers: [
    { provide: PricingConfigurationRepositoryPort, useClass: PricingConfigurationRepository },
    PricingQueryService,
    { provide: PricingPublicApi, useClass: PricingApplicationService },
    CalculateCartPricesQueryHandler,
    SetPricingTiersCommandHandler,
  ],
  exports: [PricingPublicApi],
})
export class PricingModule {}
