import { BillingUnitReadModel } from 'src/modules/tenant/infrastructure/persistence/prisma-tenant-config.adapter';
import { UnitDecomposition, decompositionToHours } from './unit-decomposition';
import { RentalPricingTierView } from '../ports/rental-product.port';

/**
 * The result of tier resolution: the matched tier plus the resolved threshold
 * in hours (persisted in the snapshot for auditability).
 */
export interface TierResolutionResult {
  tier: RentalPricingTierView;
  thresholdHours: number; // the fromUnit converted to hours for the matched tier
  totalBillableHours: number;
}

/**
 * Resolves the single PricingTier that applies to a booking using flat tier logic:
 * the highest threshold that the booking's total billable hours satisfies wins,
 * and that rate applies to the entire booking.
 *
 * Override precedence: item-level tiers take priority over product-level tiers.
 * If item-level tiers exist, product-level tiers are ignored entirely.
 *
 * @param decomposition     - Output of decomposeIntoUnits (Stage 1).
 * @param tiers             - Pre-fetched tiers (product + optional item overrides).
 * @param units             - All tenant billing units, used for hour normalization.
 * @returns                 - The matched tier and audit metadata.
 *
 * @throws {Error} if tiers array is empty.
 * @throws {Error} if a tier references an unknown billingUnitId.
 * @throws {Error} if no tier satisfies the booking duration (misconfigured tiers).
 * @throws {Error} if tiers have mixed currencies (configuration invariant).
 */
export function resolveTier(
  decomposition: UnitDecomposition,
  tiers: readonly RentalPricingTierView[],
  units: BillingUnitReadModel[],
): TierResolutionResult {
  if (tiers.length === 0) {
    throw new Error('No pricing tiers provided. Ensure the product has at least one tier configured.');
  }

  const unitMap = new Map(units.map((u) => [u.id, u]));

  // --- Override precedence: item-level tiers shadow product-level tiers ---
  const hasItemOverrides = tiers.some((t) => t.inventoryItemId !== null);
  const activeTiers = hasItemOverrides ? tiers.filter((t) => t.inventoryItemId !== null) : tiers;

  // --- Currency consistency guard ---
  const currencies = new Set(activeTiers.map((t) => t.currency));
  if (currencies.size > 1) {
    throw new Error(
      `Tiers have mixed currencies: [${[...currencies].join(', ')}]. All tiers for a product must share the same currency.`,
    );
  }

  // --- Normalize each tier's threshold to hours ---
  const tiersWithHours = activeTiers.map((tier) => {
    const unit = unitMap.get(tier.billingUnitId);
    if (!unit) {
      throw new Error(`Tier "${tier.id}" references unknown billingUnitId "${tier.billingUnitId}".`);
    }
    return {
      tier,
      thresholdHours: tier.fromUnit * unit.durationHours,
    };
  });

  // --- Total billable hours from decomposition ---
  const totalBillableHours = decompositionToHours(decomposition, units);

  // --- Flat tier lookup: highest satisfied threshold wins ---
  // Sort descending so the first match is the most specific applicable tier.
  const sorted = tiersWithHours.sort((a, b) => b.thresholdHours - a.thresholdHours);

  const match = sorted.find(({ thresholdHours }) => totalBillableHours >= thresholdHours);

  if (!match) {
    throw new Error(
      `No tier matches a booking of ${totalBillableHours} billable hours. ` +
        `The lowest configured tier threshold is ${sorted[sorted.length - 1].thresholdHours}h. ` +
        `Ensure a base tier (fromUnit: 1) is configured for this product.`,
    );
  }

  return {
    tier: match.tier,
    thresholdHours: match.thresholdHours,
    totalBillableHours,
  };
}
