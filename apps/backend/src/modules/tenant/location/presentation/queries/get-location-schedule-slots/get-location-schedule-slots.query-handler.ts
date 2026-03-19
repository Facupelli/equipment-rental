import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLocationScheduleSlotsQuery } from './get-location-schedule-slots.query';
import { TenantApplicationService } from 'src/modules/tenant/application/tenant.application-service';

@QueryHandler(GetLocationScheduleSlotsQuery)
export class GetLocationScheduleSlotsQueryHandler implements IQueryHandler<GetLocationScheduleSlotsQuery> {
  constructor(private readonly tenantService: TenantApplicationService) {}

  async execute(query: GetLocationScheduleSlotsQuery): Promise<number[]> {
    return this.tenantService.getLocationScheduleSlots({
      locationId: query.locationId,
      date: query.date,
      type: query.type,
    });
  }
}
