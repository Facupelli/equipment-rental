import { PricingTier } from '../../domain/entities/pricing-tier.entity';
import { PricingTierRepositoryPort } from '../../domain/ports/pricing-tier.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { PricingTierMapper } from './pricing-tier.mapper';

export class PrismaPricingTierRepository extends PricingTierRepositoryPort {
  constructor(private readonly prismaSerivce: PrismaService) {
    super();
  }

  async save(pricingTier: PricingTier): Promise<string> {
    const persistenceModel = PricingTierMapper.toPersistence(pricingTier);

    const createdPricingTier = await this.prismaSerivce.client.pricingTier.create({
      data: persistenceModel,
    });

    return createdPricingTier.id;
  }
}
