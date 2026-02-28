import { Injectable } from '@nestjs/common';
import { BookingQueryPort } from '../domain/ports/booking-query.port';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { GetTodayOverviewResponse, GetUpcomingScheduleResponse } from '@repo/schemas';
import { TenantConfigPort } from 'src/modules/tenancy/domain/ports/tenant-config.port';

@Injectable()
export class BookingQueryService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantConfigPort: TenantConfigPort,
    private readonly queryRepository: BookingQueryPort,
  ) {}

  async getTodayOverview(): Promise<GetTodayOverviewResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const tenantConfig = await this.tenantConfigPort.getConfig(tenantId);

    return await this.queryRepository.getTodayOverview(tenantId, tenantConfig.timezone);
  }

  async getUpcomingSchedule(): Promise<GetUpcomingScheduleResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const tenantConfig = await this.tenantConfigPort.getConfig(tenantId);

    return await this.queryRepository.getUpcomingSchedule(tenantId, tenantConfig.timezone);
  }
}
