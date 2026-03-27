import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantConfig } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';

@QueryHandler(GetTenantConfigQuery)
export class GetTenantConfigQueryHandler implements IQueryHandler<GetTenantConfigQuery, TenantConfig | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantConfigQuery): Promise<TenantConfig | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: query.tenantId },
      select: { config: true },
    });

    if (!tenant) {
      return null;
    }

    return tenant.config as TenantConfig;
  }
}
