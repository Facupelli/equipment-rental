import { Controller, Get } from '@nestjs/common';
import { BillingUnitService } from './billing-unit.service';
import { BillingUnitListResponse } from '@repo/schemas';

@Controller('billing-units')
export class BillingUnitController {
  constructor(private readonly billingUnitService: BillingUnitService) {}

  @Get()
  async getAll(): Promise<BillingUnitListResponse> {
    return await this.billingUnitService.getAll();
  }
}
