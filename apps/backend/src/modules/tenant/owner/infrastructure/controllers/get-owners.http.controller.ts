import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetOwnersQuery } from '../../application/queries/get-owners/get-owners.query';

@StaffRoute(Permission.VIEW_OWNERS)
@Controller('owners')
export class GetOwnersHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getOwners(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetOwnersQuery(user.tenantId));
  }
}
