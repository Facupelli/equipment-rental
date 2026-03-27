import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import { ScheduleWindow } from 'src/modules/tenant/location/domain/value-objects/location-schedule-window.value-object';
import { GetLocationScheduleSlotsQuery } from 'src/modules/tenant/public/queries/get-location-schedule-slots.query';

@QueryHandler(GetLocationScheduleSlotsQuery)
export class GetLocationScheduleSlotsQueryHandler implements IQueryHandler<GetLocationScheduleSlotsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLocationScheduleSlotsQuery): Promise<number[]> {
    const dayOfWeek = query.date.getDay();

    const rows = await this.prisma.client.locationSchedule.findMany({
      where: {
        locationId: query.locationId,
        location: {
          tenantId: query.tenantId,
        },
        type: query.type,
        OR: [{ specificDate: query.date }, { dayOfWeek }],
      },
      select: {
        specificDate: true,
        openTime: true,
        closeTime: true,
        slotIntervalMinutes: true,
      },
    });

    if (rows.length === 0) {
      return [];
    }

    const hasOverride = rows.some((row) => row.specificDate !== null);
    const applicableRows = hasOverride ? rows.filter((row) => row.specificDate !== null) : rows;

    const allSlots = applicableRows.flatMap((row) => {
      const window = new ScheduleWindow({
        openTime: row.openTime,
        closeTime: row.closeTime,
        slotIntervalMinutes: row.slotIntervalMinutes,
      });

      return window.generateSlots();
    });

    return [...new Set(allSlots)].sort((a, b) => a - b);
  }
}
