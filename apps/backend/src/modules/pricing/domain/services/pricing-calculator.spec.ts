import Decimal from 'decimal.js';
import { PricingTier } from '../entities/pricing-tier.entity';
import { PricingRule, PricingRuleScope, PricingRuleType } from '../entities/pricing-rule.entity';
import { NoPricingTierFoundException } from '../exceptions/pricing-calculator.exeptions';
import { PricingRuleCondition, PricingRuleEffect, RuleApplicationContext } from '../types/pricing-rule.types';
import { PricingCalculator, PricingCalculatorInput } from './pricing-calculator';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { PricingRuleEffectType } from '@repo/types';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
//
// These helpers build valid domain objects with sensible defaults.
// Override only the properties relevant to each test — everything else
// stays at its default so the test signal is clear.
// ─────────────────────────────────────────────────────────────────────────────

const CURRENCY = 'USD';
const TENANT_ID = 'tenant-1';
const PRODUCT_TYPE_ID = 'product-type-1';
const CATEGORY_ID = 'category-1';

/**
 * Creates a DateRange of exactly `minutes` duration starting from a fixed point.
 * Using a fixed anchor avoids time-dependent test failures.
 */
function makePeriod(minutes: number): DateRange {
  const start = new Date('2025-01-01T10:00:00Z');
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  return DateRange.create(start, end);
}

/**
 * Creates a PricingTier covering [fromUnit, toUnit] at the given price.
 * Pass null for toUnit to create an open-ended tier.
 */
function makeTier(fromUnit: number, toUnit: number | null, pricePerUnit: number): PricingTier {
  return PricingTier.reconstitute({
    id: `tier-${fromUnit}-${toUnit ?? 'open'}`,
    productTypeId: PRODUCT_TYPE_ID,
    bundleId: null,
    locationId: null,
    fromUnit,
    toUnit,
    pricePerUnit: new Decimal(pricePerUnit),
  });
}

/**
 * Creates a PricingRule with full control over the properties that matter
 * for filtering and discount tests.
 */
function makeRule(
  id: string,
  condition: PricingRuleCondition,
  effect: PricingRuleEffect,
  options: { stackable?: boolean; priority?: number; isActive?: boolean } = {},
): PricingRule {
  return PricingRule.reconstitute({
    id,
    tenantId: TENANT_ID,
    type: PricingRuleType.SEASONAL,
    scope: PricingRuleScope.ORDER,
    priority: options.priority ?? 0,
    stackable: options.stackable ?? false,
    isActive: options.isActive ?? true,
    condition,
    effect,
  });
}

/** A SEASONAL condition that always matches the fixed period from makePeriod(). */
const ALWAYS_ACTIVE_CONDITION: PricingRuleCondition = {
  type: PricingRuleType.SEASONAL,
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2026-12-31T23:59:59Z',
};

/** A SEASONAL condition that never matches the fixed period from makePeriod(). */
const NEVER_ACTIVE_CONDITION: PricingRuleCondition = {
  type: PricingRuleType.SEASONAL,
  dateFrom: '2020-01-01T00:00:00Z',
  dateTo: '2020-12-31T23:59:59Z',
};

/** A default context — override fields as needed per test. */
function makeContext(overrides: Partial<RuleApplicationContext> = {}): RuleApplicationContext {
  return {
    period: makePeriod(60),
    productTypeId: PRODUCT_TYPE_ID,
    orderItemCountByCategory: {},
    ...overrides,
  };
}

/**
 * Builds a minimal valid PricingCalculatorInput.
 * Each test overrides only what it needs to vary.
 */
function makeInput(overrides: Partial<PricingCalculatorInput> = {}): PricingCalculatorInput {
  return {
    period: makePeriod(60),
    billingUnitDurationMinutes: 60,
    tiers: [makeTier(1, null, 10)],
    rules: [],
    context: makeContext(),
    currency: CURRENCY,
    entityId: PRODUCT_TYPE_ID,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('PricingCalculator', () => {
  let calculator: PricingCalculator;

  beforeEach(() => {
    calculator = new PricingCalculator();
  });

  // ── Group 1: Billing unit resolution ───────────────────────────────────────

  describe('billing unit resolution', () => {
    it('exact period → exact unit count', () => {
      // 60 min / 60 min per unit = exactly 1 unit
      const result = calculator.calculate(makeInput({ period: makePeriod(60) }));
      expect(result.totalUnits).toBe(1);
    });

    it('partial unit → rounds up to next whole unit', () => {
      // 90 min / 60 min per unit = 1.5 → ceils to 2 units
      // This is the core billing rule: partial units bill as full units.
      const result = calculator.calculate(makeInput({ period: makePeriod(90) }));
      expect(result.totalUnits).toBe(2);
    });

    it('exact multi-unit period → no rounding applied', () => {
      // 120 min / 60 min per unit = exactly 2 units
      const result = calculator.calculate(makeInput({ period: makePeriod(120) }));
      expect(result.totalUnits).toBe(2);
    });

    it('sub-unit period → rounds up to 1 unit minimum', () => {
      // 30 min / 60 min per unit = 0.5 → ceils to 1 unit
      const result = calculator.calculate(makeInput({ period: makePeriod(30) }));
      expect(result.totalUnits).toBe(1);
    });
  });

  // ── Group 2: Tier resolution ────────────────────────────────────────────────

  describe('tier resolution', () => {
    it('selects the tier whose range covers the calculated units', () => {
      const tiers = [
        makeTier(1, 4, 10), // covers 1–4 units
        makeTier(5, 10, 8), // covers 5–10 units
      ];

      // 5 hours / 1h per unit = 5 units → should land in second tier
      const result = calculator.calculate(
        makeInput({ period: makePeriod(300), billingUnitDurationMinutes: 60, tiers }),
      );

      expect(result.pricePerBillingUnit.amount.toNumber()).toBe(8);
    });

    it('open-ended tier (toUnit: null) matches any unit count above its floor', () => {
      const tiers = [
        makeTier(1, 4, 10),
        makeTier(5, null, 6), // open-ended: covers 5 and above
      ];

      // 1000 units — well beyond any explicit upper bound
      const result = calculator.calculate(
        makeInput({ period: makePeriod(1000 * 60), billingUnitDurationMinutes: 60, tiers }),
      );

      expect(result.pricePerBillingUnit.amount.toNumber()).toBe(6);
    });

    it('throws NoPricingTierFoundException when no tier covers the unit count', () => {
      // Only a tier covering 5–10 units — 1 unit falls outside it
      const tiers = [makeTier(5, 10, 10)];

      expect(() =>
        calculator.calculate(makeInput({ period: makePeriod(60), billingUnitDurationMinutes: 60, tiers })),
      ).toThrow(NoPricingTierFoundException);
    });
  });

  // ── Group 3: Base price ─────────────────────────────────────────────────────

  describe('base price computation', () => {
    it('base price = pricePerUnit × units', () => {
      // 2 units × $10/unit = $20 base
      const result = calculator.calculate(
        makeInput({
          period: makePeriod(120),
          billingUnitDurationMinutes: 60,
          tiers: [makeTier(1, null, 10)],
        }),
      );

      expect(result.basePrice.amount.toNumber()).toBe(20);
      expect(result.basePrice.currency).toBe(CURRENCY);
    });

    it('no rules → final price equals base price', () => {
      const result = calculator.calculate(makeInput({ rules: [] }));
      expect(result.finalPrice.equals(result.basePrice)).toBe(true);
    });
  });

  // ── Group 4: Rule filtering ─────────────────────────────────────────────────

  describe('rule filtering', () => {
    it('inactive rule is ignored', () => {
      const inactiveRule = makeRule(
        'rule-inactive',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 50 },
        { isActive: false },
      );

      const result = calculator.calculate(makeInput({ rules: [inactiveRule] }));

      expect(result.appliedDiscounts).toHaveLength(0);
      expect(result.finalPrice.equals(result.basePrice)).toBe(true);
    });

    it('non-applicable rule (condition not met) is ignored', () => {
      const rule = makeRule('rule-past', NEVER_ACTIVE_CONDITION, { type: PricingRuleEffectType.PERCENTAGE, value: 50 });

      const result = calculator.calculate(makeInput({ rules: [rule] }));

      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('non-stackable: only the highest-priority rule (lowest number) is applied', () => {
      // Both rules match, neither stackable.
      // Priority 0 wins over priority 1.
      const highPriority = makeRule(
        'rule-high',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 30 },
        { stackable: false, priority: 0 },
      );
      const lowPriority = makeRule(
        'rule-low',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: false, priority: 1 },
      );

      const result = calculator.calculate(makeInput({ rules: [lowPriority, highPriority] }));

      expect(result.appliedDiscounts).toHaveLength(1);
      expect(result.appliedDiscounts[0].ruleId).toBe('rule-high');
    });

    it('stackable rules: all applicable rules are applied', () => {
      const rule1 = makeRule(
        'rule-1',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: true },
      );
      const rule2 = makeRule(
        'rule-2',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 5 },
        { stackable: true },
      );

      const result = calculator.calculate(makeInput({ rules: [rule1, rule2] }));

      expect(result.appliedDiscounts).toHaveLength(2);
    });

    it('non-stackable and stackable rules are independent — both are applied', () => {
      const nonStackable = makeRule(
        'rule-non-stackable',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 20 },
        { stackable: false, priority: 0 },
      );
      const stackable = makeRule(
        'rule-stackable',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: true },
      );

      const result = calculator.calculate(makeInput({ rules: [nonStackable, stackable] }));

      expect(result.appliedDiscounts).toHaveLength(2);
    });

    describe('SEASONAL condition', () => {
      it('applies when period.start falls within the seasonal window', () => {
        // Period starts 2025-01-01 — window is 2024–2026
        const rule = makeRule('rule-seasonal', ALWAYS_ACTIVE_CONDITION, {
          type: PricingRuleEffectType.PERCENTAGE,
          value: 10,
        });

        const result = calculator.calculate(makeInput({ rules: [rule] }));

        expect(result.appliedDiscounts).toHaveLength(1);
      });

      it('does not apply when period.start falls outside the seasonal window', () => {
        const rule = makeRule('rule-seasonal', NEVER_ACTIVE_CONDITION, {
          type: PricingRuleEffectType.PERCENTAGE,
          value: 10,
        });

        const result = calculator.calculate(makeInput({ rules: [rule] }));

        expect(result.appliedDiscounts).toHaveLength(0);
      });
    });

    describe('VOLUME condition', () => {
      it('applies when category item count meets the threshold', () => {
        const condition: PricingRuleCondition = {
          type: PricingRuleType.VOLUME,
          categoryId: CATEGORY_ID,
          threshold: 3,
        };
        const rule = makeRule('rule-volume', condition, { type: PricingRuleEffectType.PERCENTAGE, value: 10 });
        const context = makeContext({ orderItemCountByCategory: { [CATEGORY_ID]: 3 } });

        const result = calculator.calculate(makeInput({ rules: [rule], context }));

        expect(result.appliedDiscounts).toHaveLength(1);
      });

      it('does not apply when category item count is below the threshold', () => {
        const condition: PricingRuleCondition = {
          type: PricingRuleType.VOLUME,
          categoryId: CATEGORY_ID,
          threshold: 3,
        };
        const rule = makeRule('rule-volume', condition, { type: PricingRuleEffectType.PERCENTAGE, value: 10 });
        const context = makeContext({ orderItemCountByCategory: { [CATEGORY_ID]: 2 } });

        const result = calculator.calculate(makeInput({ rules: [rule], context }));

        expect(result.appliedDiscounts).toHaveLength(0);
      });

      it('does not apply when the category is absent from the context', () => {
        const condition: PricingRuleCondition = {
          type: PricingRuleType.VOLUME,
          categoryId: CATEGORY_ID,
          threshold: 1,
        };
        const rule = makeRule('rule-volume', condition, { type: PricingRuleEffectType.PERCENTAGE, value: 10 });
        // No entry for CATEGORY_ID in the map — defaults to 0
        const context = makeContext({ orderItemCountByCategory: {} });

        const result = calculator.calculate(makeInput({ rules: [rule], context }));

        expect(result.appliedDiscounts).toHaveLength(0);
      });
    });
  });

  // ── Group 5: Discount application ──────────────────────────────────────────

  describe('discount application', () => {
    // Base: 1 unit × $100/unit = $100 base — round numbers make assertions obvious
    function makeBaseInput(overrides: Partial<PricingCalculatorInput> = {}): PricingCalculatorInput {
      return makeInput({
        period: makePeriod(60),
        billingUnitDurationMinutes: 60,
        tiers: [makeTier(1, null, 100)],
        ...overrides,
      });
    }

    it('single PERCENTAGE discount: reduces base price by the correct amount', () => {
      // 10% of $100 = $10 discount → $90 final
      const rule = makeRule('rule-pct', ALWAYS_ACTIVE_CONDITION, { type: PricingRuleEffectType.PERCENTAGE, value: 10 });

      const result = calculator.calculate(makeBaseInput({ rules: [rule] }));

      expect(result.finalPrice.amount.toNumber()).toBe(90);
    });

    it('two PERCENTAGE discounts are additive, not compounding', () => {
      // Compounding: $100 - 10% = $90, then $90 - 10% = $81
      // Additive (correct): 10% + 10% = 20% off base → $100 - $20 = $80
      const rule1 = makeRule(
        'rule-pct-1',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: true },
      );
      const rule2 = makeRule(
        'rule-pct-2',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: true },
      );

      const result = calculator.calculate(makeBaseInput({ rules: [rule1, rule2] }));

      expect(result.finalPrice.amount.toNumber()).toBe(80);
    });

    it('single FLAT discount: reduces price by the flat amount', () => {
      // $100 - $15 flat = $85
      const rule = makeRule('rule-flat', ALWAYS_ACTIVE_CONDITION, { type: PricingRuleEffectType.FLAT, value: 15 });

      const result = calculator.calculate(makeBaseInput({ rules: [rule] }));

      expect(result.finalPrice.amount.toNumber()).toBe(85);
    });

    it('PERCENTAGE applied before FLAT: order of operations is respected', () => {
      // Base: $100
      // Step 1: 20% off → -$20 → $80
      // Step 2: $10 flat → -$10 → $70
      const pctRule = makeRule(
        'rule-pct',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 20 },
        { stackable: true },
      );
      const flatRule = makeRule(
        'rule-flat',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.FLAT, value: 10 },
        { stackable: true },
      );

      const result = calculator.calculate(makeBaseInput({ rules: [pctRule, flatRule] }));

      expect(result.finalPrice.amount.toNumber()).toBe(70);
    });

    it('discounts exceeding base price → final price clamped at zero, never negative', () => {
      // $100 base with a $200 flat discount — should not produce -$100
      const rule = makeRule('rule-flat', ALWAYS_ACTIVE_CONDITION, { type: PricingRuleEffectType.FLAT, value: 200 });

      const result = calculator.calculate(makeBaseInput({ rules: [rule] }));

      expect(result.finalPrice.amount.toNumber()).toBe(0);
    });
  });

  // ── Group 6: appliedDiscounts shape ────────────────────────────────────────

  describe('appliedDiscounts record', () => {
    function makeBaseInput(): PricingCalculatorInput {
      return makeInput({
        period: makePeriod(60),
        billingUnitDurationMinutes: 60,
        tiers: [makeTier(1, null, 100)],
      });
    }

    it('records correct metadata for a PERCENTAGE rule', () => {
      const rule = makeRule('rule-pct', ALWAYS_ACTIVE_CONDITION, { type: PricingRuleEffectType.PERCENTAGE, value: 10 });

      const result = calculator.calculate({ ...makeBaseInput(), rules: [rule] });

      const discount = result.appliedDiscounts[0];
      expect(discount.ruleId).toBe('rule-pct');
      expect(discount.type).toBe(PricingRuleEffectType.PERCENTAGE);
      expect(discount.value).toBe(10);
      // 10% of $100 = $10 discount amount
      expect(discount.discountAmount.amount.toNumber()).toBe(10);
    });

    it('records correct metadata for a FLAT rule', () => {
      const rule = makeRule('rule-flat', ALWAYS_ACTIVE_CONDITION, { type: PricingRuleEffectType.FLAT, value: 25 });

      const result = calculator.calculate({ ...makeBaseInput(), rules: [rule] });

      const discount = result.appliedDiscounts[0];
      expect(discount.ruleId).toBe('rule-flat');
      expect(discount.type).toBe(PricingRuleEffectType.FLAT);
      expect(discount.value).toBe(25);
      expect(discount.discountAmount.amount.toNumber()).toBe(25);
    });

    it('each PERCENTAGE rule records its individual contribution even when stacked', () => {
      // Two stackable percentage rules — combined 20% off $100 = $80 final.
      // Each rule should record its own $10 contribution, not the combined $20.
      const rule1 = makeRule(
        'rule-pct-1',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: true },
      );
      const rule2 = makeRule(
        'rule-pct-2',
        ALWAYS_ACTIVE_CONDITION,
        { type: PricingRuleEffectType.PERCENTAGE, value: 10 },
        { stackable: true },
      );

      const result = calculator.calculate({ ...makeBaseInput(), rules: [rule1, rule2] });

      expect(result.appliedDiscounts).toHaveLength(2);
      expect(result.appliedDiscounts[0].discountAmount.amount.toNumber()).toBe(10);
      expect(result.appliedDiscounts[1].discountAmount.amount.toNumber()).toBe(10);
    });
  });
});
