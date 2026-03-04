import { Module } from '@nestjs/common';
import { BillingUnitController } from './billing-unit.controller';
import { BillingUnitService } from './billing-unit.service';

@Module({
  controllers: [BillingUnitController],
  providers: [BillingUnitService],
})
export class BillingUnitModule {}
