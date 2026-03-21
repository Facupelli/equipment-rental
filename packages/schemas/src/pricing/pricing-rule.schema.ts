import {
  PricingRuleEffectType,
  PricingRuleScope,
  PricingRuleType,
} from "@repo/types";
import { z } from "zod";

// ── Condition schemas ─────────────────────────────────────────────────────────

export const SeasonalConditionSchema = z.object({
  type: z.literal(PricingRuleType.SEASONAL),
  dateFrom: z.iso.datetime({
    message: "dateFrom must be a valid ISO datetime string",
  }),
  dateTo: z.iso.datetime({
    message: "dateTo must be a valid ISO datetime string",
  }),
});

export const VolumeConditionSchema = z.object({
  type: z.literal(PricingRuleType.VOLUME),
  categoryId: z.uuid(),
  threshold: z.number().int().positive(),
});

export const CouponConditionSchema = z.object({
  type: z.literal(PricingRuleType.COUPON),
  code: z.string().min(1).trim().toUpperCase(),
});

export const CustomerSpecificConditionSchema = z.object({
  type: z.literal(PricingRuleType.CUSTOMER_SPECIFIC),
  customerId: z.uuid(),
});

export const PricingRuleConditionSchema = z.discriminatedUnion("type", [
  SeasonalConditionSchema,
  VolumeConditionSchema,
  CouponConditionSchema,
  CustomerSpecificConditionSchema,
]);

export type PricingRuleCondition = z.infer<typeof PricingRuleConditionSchema>;

// ── Effect schemas ────────────────────────────────────────────────────────────

export const PercentageEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.PERCENTAGE),
  value: z.number().min(0).max(100),
});

export const FlatEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.FLAT),
  value: z.number().positive(),
});

export const PricingRuleEffectSchema = z.discriminatedUnion("type", [
  PercentageEffectSchema,
  FlatEffectSchema,
]);

export type PricingRuleEffect = z.infer<typeof PricingRuleEffectSchema>;

// ── Create pricing rule schema ────────────────────────────────────────────────

export const createPricingRuleSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(PricingRuleType),
    scope: z.enum(PricingRuleScope),
    priority: z.number().int().min(0),
    stackable: z.boolean(),
    condition: PricingRuleConditionSchema,
    effect: PricingRuleEffectSchema,
  })
  .superRefine((data, ctx) => {
    const conditionType = data.condition.type;
    const ruleType = data.type;

    if (conditionType !== ruleType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["condition"],
        message: `condition.type "${conditionType}" does not match rule type "${ruleType}"`,
      });
    }

    if (
      data.condition.type === "SEASONAL" &&
      data.condition.dateFrom >= data.condition.dateTo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["condition", "dateTo"],
        message: "dateTo must be strictly after dateFrom",
      });
    }
  });

export type CreatePricingRuleDto = z.infer<typeof createPricingRuleSchema>;
