import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetRentalBundlesQuery } from './get-rental-bundles.query';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  AvailableAssetCountReadModel,
  GetAvailableAssetCountsQuery,
} from 'src/modules/inventory/public/queries/get-available-asset-counts.query';
import { BundleListResponseDto, ProductTypeIncludedItemDto } from '@repo/schemas';

@Injectable()
@QueryHandler(GetRentalBundlesQuery)
export class GetCombosQueryHandler implements IQueryHandler<GetRentalBundlesQuery, BundleListResponseDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetRentalBundlesQuery): Promise<BundleListResponseDto> {
    const { tenantId, locationId, startDate, endDate } = query;

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
              select: { id: true, name: true, description: true, includedItems: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    const productTypeIds = [
      ...new Set(bundles.flatMap((bundle) => bundle.components.map((component) => component.productType.id))),
    ];

    const availableCounts = await this.resolveAvailability(locationId, startDate, endDate, productTypeIds);

    return (
      availableCounts === null
        ? bundles
        : bundles.filter((bundle) =>
            bundle.components.every(
              (component) => (availableCounts.get(component.productType.id) ?? 0) >= component.quantity,
            ),
          )
    ).map((bundle) => ({
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
          includedItems: component.productType.includedItems as ProductTypeIncludedItemDto[],
          imageUrl: component.productType.imageUrl ?? null,
        },
      })),
    }));
  }

  private async resolveAvailability(
    locationId: string,
    startDate: Date | undefined,
    endDate: Date | undefined,
    productTypeIds: string[],
  ): Promise<Map<string, number> | null> {
    if (!startDate || !endDate) return null;

    const availabilityRows = await this.queryBus.execute<GetAvailableAssetCountsQuery, AvailableAssetCountReadModel[]>(
      new GetAvailableAssetCountsQuery(locationId, startDate, endDate, productTypeIds),
    );

    const availableCounts = new Map(availabilityRows.map((row) => [row.productTypeId, row.availableCount]));
    return availableCounts;
  }
}
