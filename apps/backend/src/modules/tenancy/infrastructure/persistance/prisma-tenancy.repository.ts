import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantMapper } from './tenant.mapper';
import { TenancyRepository } from '../../domain/repositories/tenancy.repository';

@Injectable()
export class PrismaTenancyRepository implements TenancyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const rawTenant = await this.prisma.client.tenant.findUnique({ where: { id } });
    return rawTenant ? TenantMapper.toDomain(rawTenant) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const rawTenant = await this.prisma.client.tenant.findUnique({ where: { slug } });
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
