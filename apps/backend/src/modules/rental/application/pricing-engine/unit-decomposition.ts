import { RoundingRule } from 'src/modules/tenancy/domain/entities/billing-unit.entity';
import { BillingUnitReadModel } from 'src/modules/tenancy/infrastructure/persistance/prisma-tenant-config.adapter';

/**
 * The decomposition result: a map from BillingUnit.name → quantity.
 * Only units with quantity > 0 are included.
 *
 * e.g. { full_day: 2, half_day: 1 }
 */
export type UnitDecomposition = Record<string, number>;

/**
 * Decomposes a duration (in hours) into the fewest billing units possible,
 * using a greedy algorithm (largest unit first).
 *
 * The function is intentionally pure: no I/O, no side effects, deterministic.
 * The application layer is responsible for pre-fetching and sorting units.
 *
 * @param totalHours   - The billable duration after calendar rules are applied.
 * @param units        - Tenant's billing units. Will be sorted internally by
 *                       sortOrder descending, so caller order does not matter.
 * @param roundingRule - What to do with a remainder smaller than the smallest unit.
 * @returns            - A record of { unitName: quantity } for every unit used.
 *
 * @throws {Error} if totalHours is negative.
 * @throws {Error} if units array is empty.
 */
export function decomposeIntoUnits(
  totalHours: number,
  units: BillingUnitReadModel[],
  roundingRule: RoundingRule,
): UnitDecomposition {
  if (totalHours < 0) {
    throw new Error(`totalHours must be non-negative, received: ${totalHours}`);
  }

  if (units.length === 0) {
    throw new Error('At least one BillingUnit must be provided.');
  }

  // Sort largest unit first — the greedy algorithm depends on this order.
  const sorted = [...units].sort((a, b) => b.sortOrder - a.sortOrder);

  const result: UnitDecomposition = {};
  let remainingHours = totalHours;

  for (let i = 0; i < sorted.length; i++) {
    const unit = sorted[i];
    const isLastUnit = i === sorted.length - 1;
    const quantity = Math.floor(remainingHours / unit.durationHours);

    if (quantity > 0) {
      result[unit.name] = quantity;
      remainingHours -= quantity * unit.durationHours;
    }

    // Handle the remainder once we reach the smallest unit.
    if (isLastUnit && remainingHours > 0) {
      if (roundingRule === 'ROUND_UP') {
        // Round up: add one more of the smallest unit.
        result[unit.name] = (result[unit.name] ?? 0) + 1;
        remainingHours = 0;
      }
      // SPLIT: remainder is smaller than the smallest unit — nothing more to do.
      // This covers cases like 1h with [full_day=24h, half_day=12h]: result is {}.
      // The caller (PricingEngine) decides how to handle a zero-unit decomposition.
    }
  }

  return result;
}

/**
 * Returns the total billable hours represented by a decomposition result.
 * Useful for tier threshold comparison in the next pipeline stage.
 *
 * e.g. { full_day: 2, half_day: 1 } with units → 48 + 12 = 60h
 */
export function decompositionToHours(decomposition: UnitDecomposition, units: BillingUnitReadModel[]): number {
  const unitMap = new Map(units.map((u) => [u.name, u]));

  return Object.entries(decomposition).reduce((total, [name, quantity]) => {
    const unit = unitMap.get(name);
    if (!unit) {
      throw new Error(`Unknown billing unit in decomposition: "${name}"`);
    }
    return total + unit.durationHours * quantity;
  }, 0);
}
