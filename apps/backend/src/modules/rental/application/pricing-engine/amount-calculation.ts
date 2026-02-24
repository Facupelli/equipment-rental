import { Money } from '../../domain/value-objects/money.vo';
import { PriceBreakdown } from '../../domain/value-objects/price-breakdown.vo';
import { TierResolutionResult } from './tier-resolution';
import { UnitDecomposition } from './unit-decomposition';
import { CalendarAdjustment } from './pricing-engine';
import { BillingUnitReadModel } from 'src/modules/tenancy/infrastructure/persistance/prisma-tenant-config.adapter';

/**
 * Calculates the total rental cost and assembles the immutable PriceBreakdown VO.
 *
 * Flat tier model: every unit in the decomposition is billed at the single
 * matched tier's pricePerUnit, regardless of unit type.
 *
 * @param decomposition       - Output of decomposeIntoUnits (Stage 1).
 * @param tierResolution      - Output of resolveTier (Stage 2).
 * @param units               - Tenant billing units, used to label line items.
 * @param rawDurationHours    - Pre-calendar-rule duration, for snapshot auditability.
 * @param calendarAdjustments - Applied calendar rules, for snapshot auditability.
 * @returns                   - Immutable PriceBreakdown VO ready for persistence.
 *
 * @throws {Error} if the decomposition is empty (no billable units).
 */
export function calculateAmount(
  decomposition: UnitDecomposition,
  tierResolution: TierResolutionResult,
  units: BillingUnitReadModel[],
  rawDurationHours: number,
  calendarAdjustments: CalendarAdjustment[],
): PriceBreakdown {
  const entries = Object.entries(decomposition);

  if (entries.length === 0) {
    throw new Error(
      'Cannot calculate amount: decomposition is empty. ' +
        'The booking duration is shorter than the smallest configured billing unit.',
    );
  }

  const { tier, thresholdHours, totalBillableHours } = tierResolution;
  const unitMap = new Map(units.map((u) => [u.name, u]));
  const ratePerUnit = Money.of(tier.pricePerUnit, tier.currency);

  const priceEntries = entries.map(([unitName, quantity]) => {
    if (!unitMap.has(unitName)) {
      throw new Error(`Unknown billing unit in decomposition: "${unitName}"`);
    }

    return {
      unitName,
      quantity,
      rateApplied: ratePerUnit,
      subtotal: ratePerUnit.multiply(quantity),
    };
  });

  return PriceBreakdown.create({
    entries: priceEntries,
    totalBillableHours,
    rawDurationHours,
    tierApplied: {
      tierId: tier.id,
      fromUnit: tier.fromUnit,
      thresholdHours,
      pricePerUnit: ratePerUnit,
    },
    calendarAdjustments,
  });
}
