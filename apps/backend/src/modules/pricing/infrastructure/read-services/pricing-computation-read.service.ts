import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PricingTier } from '../../domain/entities/pricing-tier.entity';
import { PromotionMapper } from '../persistence/mappers/promotion.mapper';
import { PricingTierMapper } from '../persistence/mappers/pricing-tier.mapper';

export type ProductTypeMeta = {
  billingUnitDurationMinutes: number;
  categoryId: string | null;
};

export type BundleMeta = {
  billingUnitDurationMinutes: number;
};

export type ComponentTierData = {
  billingUnitDurationMinutes: number;
  tiers: PricingTier[];
};

@Injectable()
export class PricingComputationReadService {
  constructor(private readonly prisma: PrismaService) {}

  async loadProductTypeMeta(productTypeId: string): Promise<ProductTypeMeta | null> {
    const row = await this.prisma.client.productType.findUnique({
      where: { id: productTypeId },
      select: {
        categoryId: true,
        billingUnit: { select: { durationMinutes: true } },
      },
    });

    if (!row) return null;

    return {
      billingUnitDurationMinutes: row.billingUnit.durationMinutes,
      categoryId: row.categoryId,
    };
  }

  async loadProductTypeMetaBatch(productTypeIds: string[]): Promise<Map<string, ProductTypeMeta>> {
    const rows = await this.prisma.client.productType.findMany({
      where: { id: { in: productTypeIds } },
      select: {
        id: true,
        categoryId: true,
        billingUnit: { select: { durationMinutes: true } },
      },
    });

    return new Map(
      rows.map((row) => [
        row.id,
        {
          billingUnitDurationMinutes: row.billingUnit.durationMinutes,
          categoryId: row.categoryId,
        },
      ]),
    );
  }

  async loadBundleMeta(bundleId: string): Promise<BundleMeta | null> {
    const row = await this.prisma.client.bundle.findUnique({
      where: { id: bundleId },
      select: {
        billingUnit: { select: { durationMinutes: true } },
      },
    });

    if (!row) return null;

    return {
      billingUnitDurationMinutes: row.billingUnit.durationMinutes,
    };
  }

  async loadTiersForProduct(productTypeId: string, locationId: string): Promise<PricingTier[]> {
    const rows = await this.prisma.client.pricingTier.findMany({
      where: {
        productTypeId,
        OR: [{ locationId }, { locationId: null }],
      },
    });

    return this.resolveLocationTiers(rows.map(PricingTierMapper.toDomain), locationId);
  }

  async loadTiersForBundle(bundleId: string, locationId: string): Promise<PricingTier[]> {
    const rows = await this.prisma.client.pricingTier.findMany({
      where: {
        bundleId,
        OR: [{ locationId }, { locationId: null }],
      },
    });

    return this.resolveLocationTiers(rows.map(PricingTierMapper.toDomain), locationId);
  }

  async loadTiersForBundleComponents(
    productTypeIds: string[],
    locationId: string,
  ): Promise<Map<string, ComponentTierData>> {
    const [tierRows, metaRows] = await Promise.all([
      this.prisma.client.pricingTier.findMany({
        where: {
          productTypeId: { in: productTypeIds },
          OR: [{ locationId }, { locationId: null }],
        },
      }),
      this.prisma.client.productType.findMany({
        where: { id: { in: productTypeIds } },
        select: {
          id: true,
          billingUnit: { select: { durationMinutes: true } },
        },
      }),
    ]);

    const metaByProductTypeId = new Map(metaRows.map((row) => [row.id, row.billingUnit.durationMinutes]));
    const result = new Map<string, ComponentTierData>();

    for (const productTypeId of productTypeIds) {
      const rawTiers = tierRows.filter((row) => row.productTypeId === productTypeId).map(PricingTierMapper.toDomain);

      result.set(productTypeId, {
        billingUnitDurationMinutes: metaByProductTypeId.get(productTypeId) ?? 60,
        tiers: this.resolveLocationTiers(rawTiers, locationId),
      });
    }

    return result;
  }

  async loadActivePromotionsForTenant(tenantId: string): Promise<Promotion[]> {
    const rows = await this.prisma.client.promotion.findMany({
      where: { tenantId, isActive: true },
      include: { exclusions: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map(PromotionMapper.toDomain);
  }

  private resolveLocationTiers(tiers: PricingTier[], locationId: string): PricingTier[] {
    const byFromUnit = new Map<number, PricingTier>();

    for (const tier of tiers) {
      if (tier.locationId === null) {
        byFromUnit.set(tier.fromUnit, tier);
      }
    }

    for (const tier of tiers) {
      if (tier.locationId === locationId) {
        byFromUnit.set(tier.fromUnit, tier);
      }
    }

    return Array.from(byFromUnit.values()).sort((a, b) => a.fromUnit - b.fromUnit);
  }
}
