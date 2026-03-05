import { Injectable } from '@nestjs/common';
import { PricingRule } from '../../domain/entities/pricing-rule.entity';
import { PricingRuleRepositoryPort } from '../../domain/ports/pricing-rulte.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { PricingRuleMapper } from '../persistence/mappers/pricing-rule.mapper';

@Injectable()
export class PricingRuleRepository implements PricingRuleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<PricingRule | null> {
    const raw = await this.prisma.client.pricingRule.findUnique({ where: { id } });
    if (!raw) {
      return null;
    }
    return PricingRuleMapper.toDomain(raw);
  }

  async save(pricingRule: PricingRule): Promise<string> {
    const data = PricingRuleMapper.toPersistence(pricingRule);
    await this.prisma.client.pricingRule.upsert({
      where: { id: pricingRule.id },
      create: data,
      update: data,
    });
    return pricingRule.id;
  }
}
