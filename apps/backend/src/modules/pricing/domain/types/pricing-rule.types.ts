// ── Conditions ────────────────────────────────────────────────────────────────
// Each rule type has a distinct, narrowly typed condition shape.
// Using a discriminated union prevents condition/type mismatches at compile time.

import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';

export type SeasonalCondition = {
  type: 'SEASONAL';
  dateFrom: string; // ISO date string — compared against period.start
  dateTo: string;
};

export type VolumeCondition = {
  type: 'VOLUME';
  categoryId: string;
  threshold: number; // minimum OrderItem count in that category to trigger
};

export type CouponCondition = {
  type: 'COUPON';
  code: string;
};

export type CustomerSpecificCondition = {
  type: 'CUSTOMER_SPECIFIC';
  customerId: string;
};

export type PricingRuleCondition = SeasonalCondition | VolumeCondition | CouponCondition | CustomerSpecificCondition;

// ── Effects ───────────────────────────────────────────────────────────────────

export type PercentageEffect = {
  type: 'PERCENTAGE';
  value: number; // 0–100
};

export type FlatEffect = {
  type: 'FLAT';
  value: number; // stored as decimal amount, currency resolved at runtime
};

export type PricingRuleEffect = PercentageEffect | FlatEffect;

// ── Rule Application Context ──────────────────────────────────────────────────
// Passed to PricingRule.isApplicableTo(). Contains everything a rule needs
// to evaluate its condition without reaching outside the domain.

export type RuleApplicationContext = {
  period: DateRange;
  productTypeId?: string;
  bundleId?: string;
  categoryId?: string;
  // Count of OrderItems per category in the current order.
  // Required for VOLUME rule evaluation — a single item cannot self-evaluate.
  orderItemCountByCategory: Record<string, number>;
  customerId?: string;
  applicableCouponRuleIds?: string[];
};
