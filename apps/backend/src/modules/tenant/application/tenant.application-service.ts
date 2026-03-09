import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantPublicApi } from '../tenant.public-api';
import { TenantConfig } from '../domain/value-objects/tenant-config.vo';

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
}
