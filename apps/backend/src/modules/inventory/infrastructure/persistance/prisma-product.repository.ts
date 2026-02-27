import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { Product } from '../../domain/entities/product.entity';
import {
  findAllWithCategoryFilters,
  ProductRepositoryPort,
  ProductsWithCategory,
} from '../../domain/ports/product.repository.port';
import { ProductMapper } from './mappers/product.mapper';
import { RentalProductQueryPort, RentalProductView } from 'src/modules/rental/domain/ports/rental-product.port';
import { TrackingType } from '@repo/types';
import { CategoryMapper } from './mappers/category.mapper';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort, RentalProductQueryPort {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAllWithCategory(filters: findAllWithCategoryFilters): Promise<ProductsWithCategory> {
    const { categoryId } = filters;

    const rows = await this.prisma.client.product.findMany({
      where: { ...(categoryId ? { categoryId } : {}) },
      include: { pricingTiers: true, category: true },
    });

    return rows.map((row) => ({
      product: ProductMapper.toDomain(row),
      category: row.category ? CategoryMapper.toDomain(row.category) : null,
    }));
  }

  async save(product: Product): Promise<string> {
    const data = ProductMapper.toPersistence(product);

    const created = await this.prisma.client.product.create({ data });

    return created.id;
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
