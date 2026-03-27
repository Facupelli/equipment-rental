import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { GetLocationSchedulesQuery } from '../../application/queries/get-location-schedules/get-location-schedules.query';

@Controller('locations')
export class GetLocationSchedulesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':locationId/schedules')
  async getLocationSchedules(@CurrentUser() user: ReqUser, @Param('locationId') locationId: string) {
    return this.queryBus.execute(new GetLocationSchedulesQuery(user.tenantId, locationId));
  }
}
