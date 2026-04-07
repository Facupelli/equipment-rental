import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Public } from 'src/core/decorators/public.decorator';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';

import { GetLocationSchedulesQuery } from '../get-location-schedules/get-location-schedules.query';

@Public()
@Controller('rental/locations')
export class GetRentalLocationSchedulesHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(':locationId/schedules')
  async getLocationSchedules(@Param('locationId') locationId: string) {
    return this.queryBus.execute(new GetLocationSchedulesQuery(this.tenantContext.requireTenantId(), locationId));
  }
}
