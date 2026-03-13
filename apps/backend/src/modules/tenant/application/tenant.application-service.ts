import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetLocationScheduleSlotsDto, TenantPublicApi } from '../tenant.public-api';
import { TenantConfig } from '../domain/value-objects/tenant-config.vo';
import { ScheduleWindow } from '../domain/value-objects/location-schedule-window.vo';

@Injectable()
export class TenantApplicationService implements TenantPublicApi {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: string): Promise<TenantConfig> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true },
    });

    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    return tenant.config as unknown as TenantConfig;
  }

  async getLocationScheduleSlots(dto: GetLocationScheduleSlotsDto): Promise<number[]> {
    const { locationId, date, type } = dto;

    const dayOfWeek = date.getDay();

    // Fetch all rows that could apply: matching type,
    // and either a specificDate match or a dayOfWeek match.
    const rows = await this.prisma.client.locationSchedule.findMany({
      where: {
        locationId,
        type,
        OR: [{ specificDate: date }, { dayOfWeek }],
      },
      select: {
        dayOfWeek: true,
        specificDate: true,
        openTime: true,
        closeTime: true,
        slotIntervalMinutes: true,
      },
    });

    if (rows.length === 0) {
      return [];
    }

    // Apply override precedence: if any specificDate row exists, discard all dayOfWeek rows.
    const hasOverride = rows.some((r) => r.specificDate !== null);
    const applicableRows = hasOverride ? rows.filter((r) => r.specificDate !== null) : rows;

    // Generate slots from each applicable row, merge, sort, deduplicate.
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
