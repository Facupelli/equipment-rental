import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { GetLocationsQuery } from '../../application/queries/get-locations/get-locations.query';

@Controller('locations')
export class GetLocationsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getLocations(@CurrentUser() user: ReqUser) {
    return this.queryBus.execute(new GetLocationsQuery(user.tenantId));
  }
}
