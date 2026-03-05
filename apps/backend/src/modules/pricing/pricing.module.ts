import { Module } from '@nestjs/common';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingPublicApi } from './pricing.public-api';
import { PricingQueryService } from './infrastructure/services/pricing-query.service';

@Module({
  providers: [PricingQueryService, { provide: PricingPublicApi, useClass: PricingApplicationService }],
  exports: [PricingPublicApi],
})
export class PricingModule {}
