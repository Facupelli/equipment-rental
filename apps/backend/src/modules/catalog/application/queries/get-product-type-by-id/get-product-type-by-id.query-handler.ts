import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetProductTypeByIdQuery } from './get-product-type-by-id.query';
import { ProductTypeResponse } from '@repo/schemas';
import { NotFoundException } from '@nestjs/common';
import { TrackingMode } from '@repo/types';
import { IncludedItem } from 'src/modules/catalog/domain/entities/product-type.entity';

@QueryHandler(GetProductTypeByIdQuery)
export class GetProductTypeByIdQueryHandler implements IQueryHandler<GetProductTypeByIdQuery, ProductTypeResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductTypeByIdQuery): Promise<ProductTypeResponse> {
    const productType = await this.prisma.client.productType.findUnique({
      where: { id: query.id },
      include: {
        category: true,
        billingUnit: {
          select: {
            id: true,
            label: true,
            durationMinutes: true,
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
        _count: {
          select: {
            assets: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    });

    if (!productType) {
      throw new NotFoundException('Product type not found');
    }

    return {
      id: productType.id,
      tenantId: productType.tenantId,
      name: productType.name,
      description: productType.description,
      trackingMode: productType.trackingMode as TrackingMode,
      attributes: productType.attributes as Record<string, string>,
      includedItems: productType.includedItems as unknown as IncludedItem[],
      createdAt: productType.createdAt,
      updatedAt: productType.updatedAt,
      deletedAt: productType.deletedAt,
      assetCount: productType._count.assets,
      category: productType.category
        ? {
            id: productType.category.id,
            name: productType.category.name,
            description: productType.category.description,
          }
        : null,
      billingUnit: {
        id: productType.billingUnit.id,
        label: productType.billingUnit.label,
        durationMinutes: productType.billingUnit.durationMinutes,
      },
      pricingTiers: productType.pricingTiers.map((tier) => ({
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
