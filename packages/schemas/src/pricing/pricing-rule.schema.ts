import {
  PricingRuleEffectType,
  PricingRuleScope,
  PricingRuleType,
} from "@repo/types";
import { z } from "zod";

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
});

export const CustomerSpecificConditionSchema = z.object({
  type: z.literal(PricingRuleType.CUSTOMER_SPECIFIC),
  customerId: z.uuid(),
});

export const DurationDiscountTierSchema = z.object({
  fromDays: z.number().int().min(1),
  toDays: z.number().int().min(1).nullable(),
  discountPct: z.number().min(0).max(100),
});

export const DurationConditionSchema = z
  .object({
    type: z.literal(PricingRuleType.DURATION),
    tiers: z.array(DurationDiscountTierSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const tiers = data.tiers;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (tier.toDays !== null && tier.toDays < tier.fromDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiers", i, "toDays"],
          message: `toDays must be greater than or equal to fromDays`,
        });
      }
      if (i > 0) {
        const prev = tiers[i - 1];
        const prevEnd = prev.toDays ?? Infinity;
        if (tier.fromDays <= prevEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tiers", i, "fromDays"],
            message: `Tiers must not overlap`,
          });
        }
      }
    }

    const lastTier = tiers[tiers.length - 1];
    if (lastTier.toDays !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tiers", tiers.length - 1, "toDays"],
        message: `The last tier must have toDays as null (open-ended)`,
      });
    }
  });

export const PricingRuleConditionSchema = z.discriminatedUnion("type", [
  SeasonalConditionSchema,
  VolumeConditionSchema,
  CouponConditionSchema,
  CustomerSpecificConditionSchema,
  DurationConditionSchema,
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
