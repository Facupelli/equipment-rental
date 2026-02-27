import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { InventoryItemStatus, TrackingType } from '@repo/types';
import { Prisma } from 'src/generated/prisma/client';
import { IncludedItem } from '../../domain/value-objects/included-item';
import { ProductQueryPort } from '../../domain/ports/product-query.port';
import { GetProductsQueryDto, PaginatedDto, ProductDetailDto, ProductListItemResponseDto } from '@repo/schemas';

@Injectable()
export class PrismaProductQueryRepository implements ProductQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: GetProductsQueryDto): Promise<PaginatedDto<ProductListItemResponseDto>> {
    const { categoryId, trackingType, page, limit } = filters;

    const where: Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(trackingType ? { trackingType } : {}),
    };

    const [rows, total] = await this.prisma.client.$transaction([
      this.prisma.client.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.product.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        trackingType: row.trackingType as TrackingType,
        attributes: row.attributes as Record<string, unknown>,
        includedItems: (row.includedItems as unknown as IncludedItem[]) ?? [],
        category: row.category ? { id: row.category.id, name: row.category.name } : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<ProductDetailDto | null> {
    const row = await this.prisma.client.product.findFirst({
      where: { id },
      include: {
        category: true,
        pricingTiers: {
          include: { billingUnit: true },
          orderBy: [{ billingUnit: { sortOrder: 'asc' } }, { fromUnit: 'asc' }],
        },
        inventoryItems: {
          where: { status: { not: 'RETIRED' } },
          include: { location: true, owner: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      trackingType: row.trackingType as TrackingType,
      attributes: row.attributes as Record<string, unknown>,
      includedItems: (row.includedItems as unknown as IncludedItem[]) ?? [],
      category: row.category ? { id: row.category.id, name: row.category.name } : null,
      pricingTiers: row.pricingTiers.map((tier) => ({
        id: tier.id,
        fromUnit: tier.fromUnit.toNumber(),
        pricePerUnit: tier.pricePerUnit.toNumber(),
        currency: tier.currency,
        inventoryItemId: tier.inventoryItemId,
        billingUnit: {
          id: tier.billingUnit.id,
          name: tier.billingUnit.name,
          durationHours: tier.billingUnit.durationHours.toNumber(),
        },
      })),
      inventoryItems: row.inventoryItems.map((item) => ({
        id: item.id,
        serialNumber: item.serialNumber,
        totalQuantity: item.totalQuantity,
        status: item.status as InventoryItemStatus,
        location: { id: item.location.id, name: item.location.name },
        owner: { id: item.owner.id, name: item.owner.name },
        createdAt: item.createdAt,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
