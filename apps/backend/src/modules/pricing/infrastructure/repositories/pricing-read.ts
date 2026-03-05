import { Injectable } from '@nestjs/common';
import { PricingTier } from 'src/modules/catalog/domain/entities/pricing-tier.entity';
import { PricingTierMapper } from 'src/modules/catalog/infrastructure/persistence/mappers/pricing-tier.mapper';
import { PricingRule } from '../../domain/entities/pricing-rule.entity';
import { PricingRuleMapper } from '../persistence/mappers/pricing-rule.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { BundleMeta, PricingReadRepositoryPort, ProductTypeMeta } from '../../domain/ports/pricing-read.port';

@Injectable()
export class PricingRead implements PricingReadRepositoryPort {
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
