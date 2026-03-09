import { Injectable } from '@nestjs/common';
import { PricingRule } from '../../domain/entities/pricing-rule.entity';
import { PricingRuleMapper } from '../persistence/mappers/pricing-rule.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { PricingTier } from '../../domain/entities/pricing-tier.entity';
import { PricingTierMapper } from '../persistence/mappers/pricing-tier.mapper';

export type ProductTypeMeta = {
  billingUnitDurationMinutes: number;
  categoryId: string | null;
};

export type BundleMeta = {
  billingUnitDurationMinutes: number;
};

/**
 * Concrete infrastructure service for pricing reads.
 *
 * Loads pricing data (tiers, rules, product meta) needed by PricingCalculator.
 * Not abstracted behind a port — it is internal to the pricing module
 * with a single implementation, making the abstraction unnecessary.
 */
@Injectable()
export class PricingQueryService {
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

  /**
   * Batch variant of loadProductTypeMeta.
   *
   * Loads meta for multiple product types in a single query — avoids N+1
   * when pricing a full cart. Returns a Map keyed by productTypeId.
   * Missing IDs are simply absent from the map — callers must check presence.
   */
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

  async loadActiveRulesForTenant(tenantId: string): Promise<PricingRule[]> {
    const rows = await this.prisma.client.pricingRule.findMany({
      where: { tenantId, isActive: true },
      orderBy: { priority: 'asc' },
    });

    return rows.map(PricingRuleMapper.toDomain);
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Location-specific tiers shadow global tiers for the same fromUnit band.
   *
   * For each fromUnit value, if a location-specific tier exists it wins.
   * If only a global tier exists for that band, it is kept as the fallback.
   * This means the calculator always receives at most one tier per band.
   */
  private resolveLocationTiers(tiers: PricingTier[], locationId: string): PricingTier[] {
    const byFromUnit = new Map<number, PricingTier>();

    // First pass: insert global tiers as defaults
    for (const tier of tiers) {
      if (tier.locationId === null) {
        byFromUnit.set(tier.fromUnit, tier);
      }
    }

    // Second pass: location-specific tiers override globals for same fromUnit
    for (const tier of tiers) {
      if (tier.locationId === locationId) {
        byFromUnit.set(tier.fromUnit, tier);
      }
    }

    return Array.from(byFromUnit.values()).sort((a, b) => a.fromUnit - b.fromUnit);
  }
}
