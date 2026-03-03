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
    const currentComponentIds = new Set(currentComponents.map((c) => c.id));
    const currentTiers = bundle.getPricingTiers();
    const currentTierIds = new Set(currentTiers.map((t) => t.id));

    await this.prisma.client.$transaction(async (tx) => {
      await tx.bundle.upsert({
        where: { id: bundle.id },
        create: rootData,
        update: rootData,
      });

      // 2. Reconcile BundleComponents — immutable once created, only insert new ones
      const existingComponents = await tx.bundleComponent.findMany({
        where: { bundleId: bundle.id },
        select: { id: true },
      });
      const existingComponentIds = new Set(existingComponents.map((c) => c.id));

      const componentsToDelete = [...existingComponentIds].filter((id) => !currentComponentIds.has(id));
      if (componentsToDelete.length > 0) {
        await tx.bundleComponent.deleteMany({
          where: { id: { in: componentsToDelete } },
        });
      }

      const componentsToInsert = currentComponents.filter((c) => !existingComponentIds.has(c.id));
      for (const component of componentsToInsert) {
        const data = BundleComponentMapper.toPersistence(component);
        await tx.bundleComponent.upsert({
          where: { id: component.id },
          create: data,
          update: data,
        });
      }

      // 3. Reconcile PricingTiers — mutable, upsert all current tiers
      const existingTiers = await tx.pricingTier.findMany({
        where: { bundleId: bundle.id },
        select: { id: true },
      });
      const existingTierIds = new Set(existingTiers.map((t) => t.id));

      const tiersToDelete = [...existingTierIds].filter((id) => !currentTierIds.has(id));
      if (tiersToDelete.length > 0) {
        await tx.pricingTier.deleteMany({
          where: { id: { in: tiersToDelete } },
        });
      }

      for (const tier of currentTiers) {
        const data = PricingTierMapper.toPersistence(tier);
        await tx.pricingTier.upsert({
          where: { id: tier.id },
          create: data,
          update: data,
        });
      }
    });

    return bundle.id;
  }
}
