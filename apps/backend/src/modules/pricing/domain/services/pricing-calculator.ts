import Decimal from 'decimal.js';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { Money } from 'src/modules/order/domain/value-objects/money.vo';
import { PricingRule } from '../entities/pricing-rule.entity';
import { RuleApplicationContext } from '../types/pricing-rule.types';
import { NoPricingTierFoundException } from '../exceptions/pricing-calculator.exeptions';
import { PricingTier } from '../entities/pricing-tier.entity';
import { PricingRuleEffectType } from '@repo/types';

export type AppliedDiscount = {
  ruleId: string;
  type: PricingRuleEffectType;
  value: number;
  discountAmount: Money;
};

export type PricingResult = {
  basePrice: Money;
  finalPrice: Money;
  pricePerBillingUnit: Money;
  totalUnits: number;
  appliedDiscounts: AppliedDiscount[];
};

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
  calculate(input: PricingCalculatorInput): PricingResult {
    const units = this.resolveUnits(input.period, input.billingUnitDurationMinutes);
    const tier = this.resolveTier(input.tiers, units, input.entityId);
    const basePrice = this.computeBasePrice(tier, units, input.currency);
    const applicableRules = this.filterRules(input.rules, input.context);
    const { finalPrice, appliedDiscounts } = this.applyDiscounts(basePrice, applicableRules, input.currency);

    return {
      basePrice,
      finalPrice,
      pricePerBillingUnit: Money.of(tier.pricePerUnit, input.currency),
      totalUnits: units,
      appliedDiscounts,
    };
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
  private applyDiscounts(
    base: Money,
    rules: PricingRule[],
    currency: string,
  ): { finalPrice: Money; appliedDiscounts: AppliedDiscount[] } {
    let result = base;
    const appliedDiscounts: AppliedDiscount[] = [];

    const percentageRules = rules.filter((r) => r.effect.type === 'PERCENTAGE');
    const flatRules = rules.filter((r) => r.effect.type === 'FLAT');

    // ── Percentage discounts: additive, applied as a single combined pass ──
    const totalPercentage = percentageRules.reduce(
      (sum, r) => sum + (r.effect as { type: 'PERCENTAGE'; value: number }).value,
      0,
    );

    if (totalPercentage > 0) {
      // Distribute the combined discount proportionally back to each rule
      // so each rule records its individual contribution.
      for (const rule of percentageRules) {
        const effect = rule.effect as { type: PricingRuleEffectType.PERCENTAGE; value: number };
        const discountAmount = base.multiply(new Decimal(effect.value).div(100));
        appliedDiscounts.push({
          ruleId: rule.id,
          type: PricingRuleEffectType.PERCENTAGE,
          value: effect.value,
          discountAmount,
        });
      }

      const totalDiscountAmount = base.multiply(new Decimal(totalPercentage).div(100));
      result = result.subtract(totalDiscountAmount);
    }

    // ── Flat discounts: applied sequentially ──────────────────────────────
    for (const rule of flatRules) {
      const effect = rule.effect as { type: PricingRuleEffectType.FLAT; value: number };
      const discountAmount = Money.of(effect.value, currency);
      appliedDiscounts.push({ ruleId: rule.id, type: PricingRuleEffectType.FLAT, value: effect.value, discountAmount });
      result = result.subtract(discountAmount);
    }

    return {
      finalPrice: result.clampAbove(Money.zero(currency)),
      appliedDiscounts,
    };
  }
}
