import { PricingTier } from 'src/modules/catalog/domain/entities/pricing-tier.entity';
import { PricingRule } from '../entities/pricing-rule.entity';

export type ProductTypeMeta = {
  billingUnitDurationMinutes: number;
  categoryId: string | null;
};

export type BundleMeta = {
  billingUnitDurationMinutes: number;
};

/**
 * Read-only port for pricing data.
 *
 * Intentionally separate from write repositories — pricing reads are
 * query-shaped and never load full aggregates. The implementation goes
 * directly to the DB and returns domain entities via reconstitute().
 */
export abstract class PricingReadRepositoryPort {
  abstract loadProductTypeMeta(productTypeId: string): Promise<ProductTypeMeta | null>;
  abstract loadBundleMeta(bundleId: string): Promise<BundleMeta | null>;

  /**
   * Loads tiers for a product type, returning both global (locationId = null)
   * and location-specific rows. Resolution priority (specific > global) is
   * handled in the repository implementation before returning.
   */
  abstract loadTiersForProduct(productTypeId: string, locationId: string): Promise<PricingTier[]>;

  /**
   * Same semantics as loadTiersForProduct but for bundles.
   */
  abstract loadTiersForBundle(bundleId: string, locationId: string): Promise<PricingTier[]>;

  /**
   * Loads all active rules for a tenant. Filtering to applicable rules
   * is the responsibility of PricingRule.isApplicableTo() in the domain.
   */
  abstract loadActiveRulesForTenant(tenantId: string): Promise<PricingRule[]>;
}
