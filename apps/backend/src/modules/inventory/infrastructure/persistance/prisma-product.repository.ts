import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { Product } from '../../domain/entities/product.entity';
import {
  FindAllWithCategoryFilters,
  PaginatedProducts,
  ProductRepositoryPort,
} from '../../domain/ports/product.repository.port';
import { ProductMapper } from './mappers/product.mapper';
import { RentalProductQueryPort, RentalProductView } from 'src/modules/rental/domain/ports/rental-product.port';
import { TrackingType } from '@repo/types';
import { Prisma } from 'src/generated/prisma/client';
import { IncludedItem } from '../../domain/value-objects/included-item';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort, RentalProductQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  // DOMAIN
  async save(product: Product): Promise<string> {
    const data = ProductMapper.toPersistence(product);

    const created = await this.prisma.client.product.create({ data });

    return created.id;
  }

  // READ

  async findTrackingType(id: string): Promise<TrackingType | null> {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
      select: {
        id: true,
        trackingType: true,
        // Add isActive: true, deletedAt: true if validation needs them
      },
    });

    if (!product) return null;

    return product.trackingType as TrackingType;
  }

  async findAllWithCategory(filters: FindAllWithCategoryFilters): Promise<PaginatedProducts> {
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

  async findRentalProductById(id: string): Promise<RentalProductView | null> {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        trackingType: true,
        pricingTiers: {
          select: {
            id: true,
            billingUnitId: true,
            inventoryItemId: true,
            fromUnit: true,
            pricePerUnit: true,
            currency: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      tenantId: product.tenantId,
      trackingType: product.trackingType as TrackingType,
      pricingTiers: product.pricingTiers.map((tier) => ({
        id: tier.id,
        billingUnitId: tier.billingUnitId,
        inventoryItemId: tier.inventoryItemId,
        fromUnit: tier.fromUnit.toNumber(),
        pricePerUnit: tier.pricePerUnit.toNumber(),
        currency: tier.currency,
      })),
    };
  }
}
