import { StaffOnly } from 'src/core/decorators/staff-only.decorator';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantResponse } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetTenantQuery } from '../../application/queries/get-tenant/get-tenant.query';

@StaffOnly()
@Controller('tenants')
export class GetCurrentTenantHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  async me(@CurrentUser() reqUser: AuthenticatedUser): Promise<TenantResponse> {
    const tenant = await this.queryBus.execute<GetTenantQuery, TenantResponse | null>(
      new GetTenantQuery(reqUser.tenantId),
    );

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
