import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { TenantBillingUnitListResponse } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetTenantBillingUnitsQuery } from '../../application/queries/get-billing-units/get-tenant-billing-units.query';

@StaffRoute(Permission.VIEW_LOCATIONS)
@Controller('tenants')
export class GetTenantBillingUnitsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('billing-units')
  async getBillingUnits(@CurrentUser() user: AuthenticatedUser): Promise<TenantBillingUnitListResponse | null> {
    return this.queryBus.execute<GetTenantBillingUnitsQuery, TenantBillingUnitListResponse | null>(
      new GetTenantBillingUnitsQuery(user.tenantId),
    );
  }
}
