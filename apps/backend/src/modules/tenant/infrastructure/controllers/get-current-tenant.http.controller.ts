import { Controller, Get, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantResponse } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { GetTenantQuery } from '../../application/queries/get-tenant/get-tenant.query';

@Controller('tenants')
export class GetCurrentTenantHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  async me(@CurrentUser() reqUser: ReqUser): Promise<TenantResponse> {
    const tenant = await this.queryBus.execute<GetTenantQuery, TenantResponse | null>(
      new GetTenantQuery(reqUser.tenantId),
    );

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
