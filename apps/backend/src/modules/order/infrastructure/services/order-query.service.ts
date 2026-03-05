import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export type ProductTypeMeta = {
  id: string;
  categoryId: string | null;
};

export type BundleWithComponents = {
  id: string;
  name: string;
  components: {
    productTypeId: string;
    productTypeName: string;
    quantity: number;
  }[];
};

// TODO: move to catalog module
/**
 * Pre-flight reads for order creation.
 *
 * Loads metadata needed before the transaction opens:
 * - ProductType categoryIds (for VOLUME rule context)
 * - Bundle composition (for snapshot and per-component reservation)
 *
 * Uses PrismaService directly — no domain model involved, pure data fetch.
 */
@Injectable()
export class OrderQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async loadProductTypeMeta(productTypeId: string): Promise<ProductTypeMeta | null> {
    const row = await this.prisma.client.productType.findUnique({
      where: { id: productTypeId },
      select: { id: true, categoryId: true },
    });

    return row ?? null;
  }

  async loadBundleWithComponents(bundleId: string): Promise<BundleWithComponents | null> {
    const row = await this.prisma.client.bundle.findUnique({
      where: { id: bundleId },
      select: {
        id: true,
        name: true,
        components: {
          select: {
            quantity: true,
            productType: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      components: row.components.map((c) => ({
        productTypeId: c.productType.id,
        productTypeName: c.productType.name,
        quantity: c.quantity,
      })),
    };
  }
}
