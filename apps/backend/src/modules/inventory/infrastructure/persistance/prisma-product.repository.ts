import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { Product } from '../../domain/entities/product.entity';
import { ProductMapper } from './mappers/product.mapper';
import { TrackingType } from '@repo/types';
import { ProductRepositoryPort } from '../../application/ports/product-repository.port';
import { RentalProductQueryPort, RentalProductView } from 'src/modules/rental/application/ports/rental-product.port';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort, RentalProductQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(product: Product): Promise<string> {
    const data = ProductMapper.toPersistence(product);

    const created = await this.prisma.client.product.create({ data });
    return created.id;
  }

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

  async findRentalProductById(id: string): Promise<RentalProductView | null> {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        trackingType: true,
        totalStock: true,
        // Product-level tiers (inventoryItemId: null)
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
        // Item-level override tiers, fetched via each InventoryItem's pricingTiers.
        // Only relevant for SERIALIZED products — BULK products have no InventoryItems.
        inventoryItems: {
          select: {
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
        },
      },
    });

    if (!product) {
      return null;
    }

    // Flatten product-level and all item-level tiers into a single array.
    // PricingEngine uses inventoryItemId to apply precedence at pricing time.
    const itemLevelTiers = product.inventoryItems.flatMap((item) => item.pricingTiers);

    return {
      id: product.id,
      tenantId: product.tenantId,
      trackingType: product.trackingType as TrackingType,
      totalStock: product.totalStock,
      pricingTiers: [...product.pricingTiers, ...itemLevelTiers].map((tier) => ({
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
