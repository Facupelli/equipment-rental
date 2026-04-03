import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ScheduleSlotType } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetLocationScheduleSlotsQuery } from 'src/modules/tenant/public/queries/get-location-schedule-slots.query';

import { GetLocationScheduleSlotsQueryDto } from './get-location-schedule-slots.request.dto';

@Controller('locations')
export class GetLocationScheduleSlotsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':locationId/schedules/slots')
  async getLocationScheduleSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
    @Query() query: GetLocationScheduleSlotsQueryDto,
  ): Promise<number[]> {
    if (isNaN(query.date.getTime())) {
      throw new BadRequestException('Invalid date format. Expected ISO 8601 date string (e.g. 2026-03-13).');
    }

    if (query.type !== ScheduleSlotType.PICKUP && query.type !== ScheduleSlotType.RETURN) {
      throw new BadRequestException(`Invalid type. Expected ${ScheduleSlotType.PICKUP} or ${ScheduleSlotType.RETURN}.`);
    }

    return this.queryBus.execute(new GetLocationScheduleSlotsQuery(user.tenantId, locationId, query.date, query.type));
  }
}
