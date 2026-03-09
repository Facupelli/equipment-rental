import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBundleByIdQuery } from './get-bundle-by-id.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { BundleDetailResponseDto } from '@repo/schemas';

@QueryHandler(GetBundleByIdQuery)
export class GetBundleByIdQueryHandler implements IQueryHandler<GetBundleByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBundleByIdQuery): Promise<BundleDetailResponseDto | null> {
    const bundle = await this.prisma.client.bundle.findUnique({
      where: { id: query.bundleId },
      include: {
        billingUnit: {
          select: {
            id: true,
            label: true,
            durationMinutes: true,
          },
        },
        components: {
          orderBy: { productType: { name: 'asc' } },
          select: {
            quantity: true,
            productTypeId: true,
            productType: {
              select: {
                name: true,
                description: true,
                _count: {
                  select: {
                    assets: { where: { isActive: true, deletedAt: null } },
                  },
                },
              },
            },
          },
        },
        pricingTiers: {
          // Global tiers first, then location-specific; within each group by fromUnit.
          orderBy: [{ locationId: 'asc' }, { fromUnit: 'asc' }],
          select: {
            id: true,
            fromUnit: true,
            toUnit: true,
            pricePerUnit: true,
            locationId: true,
            location: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!bundle) {
      return null;
    }

    return {
      id: bundle.id,
      name: bundle.name,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      billingUnit: {
        id: bundle.billingUnit.id,
        label: bundle.billingUnit.label,
        durationMinutes: bundle.billingUnit.durationMinutes,
      },
      components: bundle.components.map((c) => ({
        productTypeId: c.productTypeId,
        quantity: c.quantity,
        assetCount: c.productType._count.assets,
        productType: {
          name: c.productType.name,
          description: c.productType.description,
        },
      })),
      pricingTiers: bundle.pricingTiers.map((tier) => ({
        id: tier.id,
        fromUnit: tier.fromUnit,
        toUnit: tier.toUnit,
        pricePerUnit: tier.pricePerUnit.toNumber(),
        locationId: tier.locationId,
        location: tier.location ? { id: tier.location.id, name: tier.location.name } : null,
      })),
    };
  }
}
