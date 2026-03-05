import { Module } from '@nestjs/common';
import { PricingReadRepositoryPort } from './domain/ports/pricing-read.port';
import { PricingApplicationService } from './application/pricing.application-service';
import { PricingRead } from './infrastructure/repositories/pricing-read';
import { PricingPublicApi } from './pricing.public-api';

@Module({
  providers: [
    { provide: PricingReadRepositoryPort, useClass: PricingRead },
    { provide: PricingPublicApi, useClass: PricingApplicationService },
  ],
  exports: [PricingPublicApi],
})
export class PricingModule {}
