import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetLocationsQuery } from './get-locations.query';

@Controller('locations')
export class GetLocationsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getLocations(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetLocationsQuery(user.tenantId));
  }
}
