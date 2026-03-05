import Decimal from 'decimal.js';
import { PricingTier } from 'src/modules/catalog/domain/entities/pricing-tier.entity';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { Money } from 'src/modules/order/domain/value-objects/money.vo';
import { PricingRule } from '../entities/pricing-rule.entity';
import { RuleApplicationContext } from '../types/pricing-rule.types';
import { NoPricingTierFoundException } from '../exceptions/pricing-calculator.exeptions';

export type PricingCalculatorInput = {
  period: DateRange;
  billingUnitDurationMinutes: number;
  tiers: PricingTier[];
  rules: PricingRule[];
  context: RuleApplicationContext;
  currency: string;
  // The entity being priced — used in the NoPricingTierFoundException message only
  entityId: string;
};

/**
 * Pure domain service. No I/O, no side effects.
 *
 * Calculates the final price for a single order item by:
 *   1. Resolving billing units from the rental period
 *   2. Finding the matching pricing tier
 *   3. Computing base price (pricePerUnit × units)
 *   4. Applying pricing rules (discounts) with additive stacking
 *   5. Flooring the result at zero
 */
export class PricingCalculator {
  calculate(input: PricingCalculatorInput): Money {
    const units = this.resolveUnits(input.period, input.billingUnitDurationMinutes);
    const tier = this.resolveTier(input.tiers, units, input.entityId);
    const base = this.computeBasePrice(tier, units, input.currency);
    const applicableRules = this.filterRules(input.rules, input.context);
    return this.applyDiscounts(base, applicableRules, input.currency);
  }

  // ── Step 1: Billing units ─────────────────────────────────────────────────

  /**
   * Partial units bill as full units — ceiling is intentional.
   * A 90-minute rental on an hourly product = 2 units, not 1.5.
   */
  private resolveUnits(period: DateRange, billingUnitDurationMinutes: number): number {
    return Math.ceil(period.durationInMinutes() / billingUnitDurationMinutes);
  }

  // ── Step 2: Tier resolution ───────────────────────────────────────────────

  /**
   * Finds the single tier whose range covers the calculated units.
   * Tiers are assumed to be non-overlapping (enforced by DB unique constraint).
   * If no tier matches, the catalog is misconfigured — throw immediately.
   */
  private resolveTier(tiers: PricingTier[], units: number, entityId: string): PricingTier {
    const match = tiers.find((tier) => tier.coversUnits(units));
    if (!match) {
      throw new NoPricingTierFoundException(units, entityId);
    }
    return match;
  }

  // ── Step 3: Base price ────────────────────────────────────────────────────

  private computeBasePrice(tier: PricingTier, units: number, currency: string): Money {
    return Money.of(tier.pricePerUnit.mul(units), currency);
  }

  // ── Step 4: Rule filtering ────────────────────────────────────────────────

  /**
   * Separates rules into the effective set to apply:
   * - Non-stackable: only the single highest-priority (lowest number) applicable rule.
   * - Stackable: all applicable stackable rules.
   *
   * The two groups are then combined. A stackable rule never blocks a non-stackable
   * rule; they are independent axes.
   */
  private filterRules(rules: PricingRule[], context: RuleApplicationContext): PricingRule[] {
    const applicable = rules.filter((rule) => rule.isApplicableTo(context));

    const nonStackable = applicable.filter((r) => !r.stackable).sort((a, b) => a.priority - b.priority);

    const stackable = applicable.filter((r) => r.stackable);

    // Take only the winner from non-stackable rules
    const effectiveNonStackable = nonStackable.length > 0 ? [nonStackable[0]] : [];

    return [...effectiveNonStackable, ...stackable];
  }

  // ── Step 5: Apply discounts ───────────────────────────────────────────────

  /**
   * Discount application order:
   *   1. Sum all PERCENTAGE discounts → apply once against base (additive, not compounding)
   *   2. Subtract all FLAT discounts sequentially
   *   3. Clamp at zero — a price can never go negative
   *
   * Applying percentage as a single combined pass avoids order-dependency
   * and matches how business owners reason about stacked discounts.
   */
  private applyDiscounts(base: Money, rules: PricingRule[], currency: string): Money {
    let result = base;

    const totalPercentage = rules
      .filter((r) => r.effect.type === 'PERCENTAGE')
      .reduce((sum, r) => sum + (r.effect as { type: 'PERCENTAGE'; value: number }).value, 0);

    if (totalPercentage > 0) {
      const discountAmount = base.multiply(new Decimal(totalPercentage).div(100));
      result = result.subtract(discountAmount);
    }

    for (const rule of rules.filter((r) => r.effect.type === 'FLAT')) {
      const flatDiscount = Money.of((rule.effect as { type: 'FLAT'; value: number }).value, currency);
      result = result.subtract(flatDiscount);
    }

    return result.clampAbove(Money.zero(currency));
  }
}
