import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ScheduleSlotType } from '@repo/types';

import { GetLocationScheduleSlotsQuery } from 'src/modules/tenant/public/queries/get-location-schedule-slots.query';

import { GetLocationScheduleSlotsQueryDto } from './get-location-schedule-slots.request.dto';
import { Public } from 'src/core/decorators/public.decorator';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';

@Public()
@Controller('locations')
export class GetLocationScheduleSlotsHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(':locationId/schedules/slots')
  async getLocationScheduleSlots(
    @Param('locationId') locationId: string,
    @Query() query: GetLocationScheduleSlotsQueryDto,
  ): Promise<number[]> {
    // TODO: move to DTO schema
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
      throw new BadRequestException('Invalid date format. Expected ISO 8601 date string (e.g. 2026-03-13).');
    }

    if (query.type !== ScheduleSlotType.PICKUP && query.type !== ScheduleSlotType.RETURN) {
      throw new BadRequestException(`Invalid type. Expected ${ScheduleSlotType.PICKUP} or ${ScheduleSlotType.RETURN}.`);
    }

    return this.queryBus.execute(
      new GetLocationScheduleSlotsQuery(this.tenantContext.requireTenantId(), locationId, query.date, query.type),
    );
  }
}
