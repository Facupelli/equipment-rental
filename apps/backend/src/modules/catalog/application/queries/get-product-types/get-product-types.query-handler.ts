import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetProductTypesQuery } from './get-product-types.query';
import { ProductTypeListResponse } from '@repo/schemas';
import { TrackingMode } from '@repo/types';

@QueryHandler(GetProductTypesQuery)
export class GetProductTypesQueryHandler implements IQueryHandler<GetProductTypesQuery, ProductTypeListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductTypesQuery): Promise<ProductTypeListResponse> {
    const where: Record<string, unknown> = {};

    if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const productTypes = await this.prisma.client.productType.findMany({
      where,
      include: {
        category: true,
        billingUnit: true,
        pricingTiers: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return productTypes.map((pt) => ({
      id: pt.id,
      tenantId: pt.tenantId,
      name: pt.name,
      description: pt.description,
      trackingMode: pt.trackingMode as TrackingMode,
      isActive: pt.isActive,
      attributes: pt.attributes as Record<string, unknown>,
      includedItems: pt.includedItems as Record<string, unknown>[],
      createdAt: pt.createdAt,
      updatedAt: pt.updatedAt,
      deletedAt: pt.deletedAt,
      category: pt.category
        ? {
            id: pt.category.id,
            name: pt.category.name,
            description: pt.category.description,
          }
        : null,
      billingUnit: {
        id: pt.billingUnit.id,
        label: pt.billingUnit.label,
        durationMinutes: pt.billingUnit.durationMinutes,
        sortOrder: pt.billingUnit.sortOrder,
      },
      pricingTiers: pt.pricingTiers.map((tier) => ({
        id: tier.id,
        productTypeId: tier.productTypeId,
        bundleId: tier.bundleId,
        locationId: tier.locationId,
        fromUnit: tier.fromUnit,
        toUnit: tier.toUnit,
        pricePerUnit: tier.pricePerUnit.toNumber(),
        createdAt: tier.createdAt,
        updatedAt: tier.updatedAt,
      })),
    }));
  }
}
