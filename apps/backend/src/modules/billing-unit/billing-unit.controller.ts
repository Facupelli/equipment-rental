import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get } from '@nestjs/common';
import { Permission } from '@repo/types';
import { BillingUnitService } from './billing-unit.service';
import { BillingUnitListResponse } from '@repo/schemas';

@StaffRoute(Permission.VIEW_LOCATIONS)
@Controller('billing-units')
export class BillingUnitController {
  constructor(private readonly billingUnitService: BillingUnitService) {}

  @Get()
  async getAll(): Promise<BillingUnitListResponse> {
    return await this.billingUnitService.getAll();
  }
}
