import { Injectable } from '@nestjs/common';
import { Bundle } from '../../domain/entities/bundle.entity';
import { BundleRepositoryPort } from '../../domain/ports/bundle-repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { BundleComponentMapper, BundleMapper } from '../persistence/mappers/bundle.mapper';
import { PricingTierMapper } from '../persistence/mappers/pricing-tier.mapper';

@Injectable()
export class BundleRepository implements BundleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Bundle | null> {
    const raw = await this.prisma.client.bundle.findUnique({
      where: { id },
      include: {
        components: true,
        pricingTiers: true,
      },
    });
    if (!raw) return null;
    return BundleMapper.toDomain(raw);
  }

  async save(bundle: Bundle): Promise<string> {
    const rootData = BundleMapper.toPersistence(bundle);
    const currentComponents = bundle.getComponents();
    const currentTiers = bundle.getPricingTiers();

    const currentComponentIds = new Set(currentComponents.map((c) => c.id));
    const currentTierIds = new Set(currentTiers.map((t) => t.id));

    await this.prisma.client.$transaction(async (tx) => {
      await tx.bundle.upsert({
        where: { id: bundle.id },
        create: rootData,
        update: rootData,
      });

      const [existingComponents, existingTiers] = await Promise.all([
        tx.bundleComponent.findMany({
          where: { bundleId: bundle.id },
          select: { id: true },
        }),
        tx.pricingTier.findMany({
          where: { bundleId: bundle.id },
          select: { id: true },
        }),
      ]);

      const existingComponentIds = new Set(existingComponents.map((c) => c.id));
      const existingTierIds = new Set(existingTiers.map((t) => t.id));

      // Components are immutable once created — delete removed, insert new
      const componentIdsToDelete = [...existingComponentIds].filter((id) => !currentComponentIds.has(id));
      const componentsToInsert = currentComponents.filter((c) => !existingComponentIds.has(c.id));

      // Pricing tiers are mutable — delete removed, upsert all current
      const tierIdsToDelete = [...existingTierIds].filter((id) => !currentTierIds.has(id));

      await Promise.all([
        componentIdsToDelete.length > 0
          ? tx.bundleComponent.deleteMany({ where: { id: { in: componentIdsToDelete } } })
          : Promise.resolve(),

        componentsToInsert.length > 0
          ? tx.bundleComponent.createMany({
              data: componentsToInsert.map((c) => BundleComponentMapper.toPersistence(c, bundle.id)),
            })
          : Promise.resolve(),

        tierIdsToDelete.length > 0
          ? tx.pricingTier.deleteMany({ where: { id: { in: tierIdsToDelete } } })
          : Promise.resolve(),

        ...currentTiers.map((tier) => {
          const data = PricingTierMapper.toPersistence(tier, { bundleId: bundle.id });
          return tx.pricingTier.upsert({
            where: { id: tier.id },
            create: data,
            update: data,
          });
        }),
      ]);
    });

    return bundle.id;
  }
}
