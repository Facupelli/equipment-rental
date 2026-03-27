import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LocationScheduleResponseDto } from '@repo/schemas';
import { ScheduleSlotType } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetLocationSchedulesQuery } from './get-location-schedules.query';

@QueryHandler(GetLocationSchedulesQuery)
export class GetLocationSchedulesQueryHandler implements IQueryHandler<GetLocationSchedulesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLocationSchedulesQuery): Promise<LocationScheduleResponseDto[]> {
    const schedules = await this.prisma.client.locationSchedule.findMany({
      where: {
        locationId: query.locationId,
        location: {
          tenantId: query.tenantId,
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { specificDate: 'asc' }, { openTime: 'asc' }],
    });

    return schedules.map((s) => ({
      id: s.id,
      locationId: s.locationId,
      type: s.type as ScheduleSlotType,
      dayOfWeek: s.dayOfWeek,
      specificDate: s.specificDate,
      openTime: s.openTime,
      closeTime: s.closeTime,
      slotIntervalMinutes: s.slotIntervalMinutes,
    }));
  }
}
