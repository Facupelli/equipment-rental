import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetTenantQuery } from './get-tenant.query';
import { TenantConfig } from '../../../domain/value-objects/tenant-config.value-object';
import { TenantResponse } from '@repo/schemas';

@QueryHandler(GetTenantQuery)
export class GetTenantQueryHandler implements IQueryHandler<GetTenantQuery, TenantResponse | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantQuery): Promise<TenantResponse | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: query.tenantId },
      include: {
        billingUnits: {
          include: {
            billingUnit: true,
          },
          orderBy: {
            billingUnit: {
              sortOrder: 'asc',
            },
          },
        },
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      config: tenant.config as unknown as TenantConfig,
      billingUnits: tenant.billingUnits.map((tbu) => ({
        id: tbu.billingUnit.id,
        billingUnitId: tbu.billingUnit.id,
        label: tbu.billingUnit.label,
        durationMinutes: tbu.billingUnit.durationMinutes,
        sortOrder: tbu.billingUnit.sortOrder,
      })),
    };
  }
}
