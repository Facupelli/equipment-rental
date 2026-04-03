import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CustomDomainResponseDto } from '../../custom-domain.response.dto';
import { CustomDomainReadModel } from '../../custom-domain.read-model';
import { GetCustomDomainQuery } from './get-custom-domain.query';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('tenants')
export class GetCustomDomainHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('custom-domain')
  async getCurrentCustomDomain(@CurrentUser() user: AuthenticatedUser): Promise<CustomDomainResponseDto | null> {
    const result = await this.queryBus.execute<GetCustomDomainQuery, CustomDomainReadModel | null>(
      new GetCustomDomainQuery(user.tenantId),
    );

    if (!result) {
      return null;
    }

    return {
      domain: result.domain,
      status: result.status,
      verifiedAt: result.verifiedAt ? result.verifiedAt.toISOString() : null,
      lastError: result.lastError,
    };
  }
}
