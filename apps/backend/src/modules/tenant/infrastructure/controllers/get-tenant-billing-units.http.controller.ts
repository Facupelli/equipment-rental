import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantBillingUnitListResponse } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { GetTenantBillingUnitsQuery } from '../../application/queries/get-billing-units/get-tenant-billing-units.query';

@Controller('tenants')
export class GetTenantBillingUnitsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('billing-units')
  async getBillingUnits(@CurrentUser() user: ReqUser): Promise<TenantBillingUnitListResponse | null> {
    return this.queryBus.execute<GetTenantBillingUnitsQuery, TenantBillingUnitListResponse | null>(
      new GetTenantBillingUnitsQuery(user.tenantId),
    );
  }
}
