import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantMapper } from './mappers/tenant.mapper';
import { TenancyRepositoryPort } from '../../domain/ports/tenancy.repository.port';

@Injectable()
export class PrismaTenancyRepository implements TenancyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.client.tenant.count({ where: { slug } });
    return count > 0;
  }

  async load(id: string): Promise<Tenant | null> {
    const rawTenant = await this.prisma.client.tenant.findUnique({ where: { id }, include: { billingUnits: true } });
    return rawTenant ? TenantMapper.toDomain(rawTenant) : null;
  }

  async save(tenant: Tenant): Promise<string> {
    const data = TenantMapper.toPersistence(tenant);

    const result = await this.prisma.client.tenant.upsert({
      where: { id: tenant.id },
      create: data,
      update: data,
    });

    return result.id;
  }
}
