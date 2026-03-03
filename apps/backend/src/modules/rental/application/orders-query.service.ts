import { Injectable } from '@nestjs/common';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { GetTodayOverviewResponse, GetUpcomingScheduleResponse } from '@repo/schemas';
import { TenantConfigPort } from 'src/modules/tenancy/domain/ports/tenant-config.port';
import { OrdersQueryPort } from './ports/booking-query.port';

@Injectable()
export class OrdersQueryService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantConfigPort: TenantConfigPort,
    private readonly ordersQueryRepository: OrdersQueryPort,
  ) {}

  async getTodayOverview(): Promise<GetTodayOverviewResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const tenantConfig = await this.tenantConfigPort.getConfig(tenantId);

    return await this.ordersQueryRepository.getTodayOverview(tenantId, tenantConfig.timezone);
  }

  async getUpcomingSchedule(): Promise<GetUpcomingScheduleResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const tenantConfig = await this.tenantConfigPort.getConfig(tenantId);

    return await this.ordersQueryRepository.getUpcomingSchedule(tenantId, tenantConfig.timezone);
  }
}
