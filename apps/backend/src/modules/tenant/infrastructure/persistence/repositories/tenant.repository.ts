import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantReadService, TenantRepositoryPort } from 'src/modules/tenant/domain/ports/tenant.repository.port';
import { TenantBillingUnitMapper, TenantMapper } from '../mappers/tenant.mapper';
import { Tenant } from 'src/modules/tenant/domain/entities/tenant.entity';
import { TenantWithBillingUnits } from '@repo/schemas';
import { TenantConfig } from 'src/modules/tenant/domain/value-objects/tenant-config.vo';

@Injectable()
export class TenantRepository implements TenantRepositoryPort, TenantReadService {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Tenant | null> {
    const raw = await this.prisma.client.tenant.findUnique({
      where: { id },
      include: { billingUnits: true },
    });
    if (!raw) {
      return null;
    }
    return TenantMapper.toDomain(raw);
  }

  async save(tenant: Tenant): Promise<string> {
    const rootData = TenantMapper.toPersistence(tenant);
    const currentUnits = tenant.getActiveBillingUnits();
    const currentUnitIds = new Set(currentUnits.map((u) => u.id));

    await this.prisma.client.$transaction(async (tx) => {
      await tx.tenant.upsert({
        where: { id: tenant.id },
        create: rootData,
        update: rootData,
      });

      const existing = await tx.tenantBillingUnit.findMany({
        where: { tenantId: tenant.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((u) => u.id));

      const toDelete = [...existingIds].filter((id) => !currentUnitIds.has(id));
      if (toDelete.length > 0) {
        await tx.tenantBillingUnit.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      const toUpsert = currentUnits.filter((u) => !existingIds.has(u.id));
      for (const unit of toUpsert) {
        const data = TenantBillingUnitMapper.toPersistence(unit);
        await tx.tenantBillingUnit.upsert({
          where: { id: unit.id },
          create: data,
          update: data,
        });
      }
    });

    return tenant.id;
  }

  // READ SERVICE

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.client.tenant.count({ where: { slug } });
    return count > 0;
  }

  async findById(id: string): Promise<TenantWithBillingUnits | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id },
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
        label: tbu.billingUnit.label,
        durationMinutes: tbu.billingUnit.durationMinutes,
        sortOrder: tbu.billingUnit.sortOrder,
      })),
    };
  }
}
