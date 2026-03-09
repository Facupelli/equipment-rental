import { Injectable } from '@nestjs/common';
import { PricingConfiguration } from '../../domain/entities/pricing-configuration.entity';
import { PricingTargetType } from '../../domain/entities/pricing-tier.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { PricingConfigurationRepositoryPort } from '../../domain/ports/pricing-config.repository.port';
import { PricingTierMapper } from '../persistence/mappers/pricing-tier.mapper';

@Injectable()
export class PricingConfigurationRepository implements PricingConfigurationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(targetType: PricingTargetType, targetId: string): Promise<PricingConfiguration | null> {
    const where = targetType === 'PRODUCT_TYPE' ? { productTypeId: targetId } : { bundleId: targetId };

    const rows = await this.prisma.client.pricingTier.findMany({ where });

    if (rows.length === 0) {
      return null;
    }

    const tiers = rows.map(PricingTierMapper.toDomain);

    return PricingConfiguration.reconstitute({ targetType, targetId, tiers });
  }

  async save(configuration: PricingConfiguration): Promise<void> {
    const isProductType = configuration.targetType === 'PRODUCT_TYPE';

    const where = isProductType ? { productTypeId: configuration.targetId } : { bundleId: configuration.targetId };

    const rows = configuration
      .getTiers()
      .map((tier) =>
        PricingTierMapper.toPersistence(
          tier,
          isProductType ? { productTypeId: configuration.targetId } : { bundleId: configuration.targetId },
        ),
      );

    await this.prisma.client.$transaction([
      this.prisma.client.pricingTier.deleteMany({ where }),
      ...(rows.length > 0 ? [this.prisma.client.pricingTier.createMany({ data: rows })] : []),
    ]);
  }
}
