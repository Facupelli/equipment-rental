import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantBillingUnitRepositoryPort } from 'src/modules/tenant/domain/ports/billing-unit.repository.port';
import { TenantBillingUnit } from 'src/modules/tenant/domain/entities/tenant-billing-unit.entity';
import { TenantBillingUnitMapper } from '../mappers/tenant.mapper';

@Injectable()
export class TenantBillingUnitRepository implements TenantBillingUnitRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<TenantBillingUnit | null> {
    const raw = await this.prisma.client.tenantBillingUnit.findUnique({ where: { id } });
    if (!raw) {
      return null;
    }

    return TenantBillingUnitMapper.toDomain(raw);
  }

  async save(billingUnit: TenantBillingUnit): Promise<string> {
    const data = TenantBillingUnitMapper.toPersistence(billingUnit);

    await this.prisma.client.tenantBillingUnit.upsert({
      where: { id: billingUnit.id },
      create: data,
      update: data,
    });

    return billingUnit.id;
  }
}
