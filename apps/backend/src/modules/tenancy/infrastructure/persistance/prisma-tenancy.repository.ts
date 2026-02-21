import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenancyRepository } from '../../tenancy.repository';
import { Tenant } from '../../entities/tenant.entity';
import { TenantMapper } from './tenant.mapper';

@Injectable()
export class PrismaTenancyRepository implements TenancyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Tenant | null> {
    const rawTenant = await this.prisma.tenant.findUnique({ where: { slug } });
    return rawTenant ? TenantMapper.toDomain(rawTenant) : null;
  }

  async save(user: Tenant): Promise<string> {
    const data = TenantMapper.toPersistence(user);

    const result = await this.prisma.tenant.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });

    return result.id;
  }
}
