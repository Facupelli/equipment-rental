import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetRentalBundlesQuery } from './get-rental-budles.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { BundleListResponseDto } from '@repo/schemas';

@Injectable()
@QueryHandler(GetRentalBundlesQuery)
export class GetCombosQueryHandler implements IQueryHandler<GetRentalBundlesQuery, BundleListResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRentalBundlesQuery): Promise<BundleListResponseDto> {
    const { locationId } = query;

    const bundles = await this.prisma.client.bundle.findMany({
      where: {
        retiredAt: null,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
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
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return bundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      billingUnit: bundle.billingUnit,
      pricingPreview: bundle.pricingTiers[0]
        ? {
            pricePerUnit: Number(bundle.pricingTiers[0].pricePerUnit),
            fromUnit: bundle.pricingTiers[0].fromUnit,
          }
        : null,
      components: bundle.components,
    }));
  }
}
