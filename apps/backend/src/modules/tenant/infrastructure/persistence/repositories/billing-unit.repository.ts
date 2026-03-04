import { Injectable } from '@nestjs/common';
import { BillingUnit } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';
import { BillingUnitRepositoryPort } from 'src/modules/tenant/domain/ports/billing-unit.repository.port';
import { BillingUnitMapper } from '../mappers/billing-unit.mapper';

@Injectable()
export class BillingUnitRepository implements BillingUnitRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<BillingUnit | null> {
    const raw = await this.prisma.client.billingUnit.findUnique({ where: { id } });
    if (!raw) {
      return null;
    }

    return BillingUnitMapper.toDomain(raw);
  }

  async save(billingUnit: BillingUnit): Promise<string> {
    const data = BillingUnitMapper.toPersistence(billingUnit);
    await this.prisma.client.billingUnit.upsert({
      where: { id: billingUnit.id },
      create: data,
      update: data,
    });
    return billingUnit.id;
  }
}
