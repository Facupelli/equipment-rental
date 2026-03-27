import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetRentalBundlesQuery } from './get-rental-bundles.query';
import { PrismaService } from 'src/core/database/prisma.service';

type RentalIncludedItemReadModel = {
  name: string;
  quantity: number;
  notes: string | null;
};

type RentalBundleReadModel = Array<{
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  billingUnit: { label: string };
  pricingPreview: { pricePerUnit: number; fromUnit: number } | null;
  components: Array<{
    quantity: number;
    productType: {
      name: string;
      description: string | null;
      id: string;
      includedItems: RentalIncludedItemReadModel[];
    };
  }>;
}>;

@Injectable()
@QueryHandler(GetRentalBundlesQuery)
export class GetCombosQueryHandler implements IQueryHandler<GetRentalBundlesQuery, RentalBundleReadModel> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRentalBundlesQuery): Promise<RentalBundleReadModel> {
    const { tenantId, locationId } = query;

    const bundles = await this.prisma.client.bundle.findMany({
      where: {
        tenantId,
        retiredAt: null,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        description: true,
        billingUnit: {
          select: { label: true },
        },
        pricingTiers: {
          where: locationId ? { OR: [{ locationId }, { locationId: null }] } : { locationId: null },
          orderBy: [{ locationId: 'desc' }, { fromUnit: 'asc' }],
          take: 1,
          select: {
            pricePerUnit: true,
            fromUnit: true,
          },
        },
        components: {
          select: {
            quantity: true,
            productType: {
              select: { id: true, name: true, description: true, includedItems: true },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return bundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      imageUrl: bundle.imageUrl ?? '',
      description: bundle.description,
      billingUnit: bundle.billingUnit,
      pricingPreview: bundle.pricingTiers[0]
        ? {
            pricePerUnit: Number(bundle.pricingTiers[0].pricePerUnit),
            fromUnit: bundle.pricingTiers[0].fromUnit,
          }
        : null,
      components: bundle.components.map((component) => ({
        quantity: component.quantity,
        productType: {
          name: component.productType.name,
          description: component.productType.description,
          id: component.productType.id,
          includedItems: component.productType.includedItems as RentalIncludedItemReadModel[],
        },
      })),
    }));
  }
}
