import { PricingRuleEffectType, PromotionType } from "@repo/types";
import { z } from "zod";

export const promotionTypeSchema = z.enum(PromotionType);

export const promotionTargetSchema = z.object({
  excludedProductTypeIds: z.array(z.uuid()).default([]),
  excludedBundleIds: z.array(z.uuid()).default([]),
});

export const seasonalPromotionConditionSchema = z.object({
  type: z.literal(PromotionType.SEASONAL),
  dateFrom: z.iso.datetime({
    message: "dateFrom must be a valid ISO datetime string",
  }),
  dateTo: z.iso.datetime({
    message: "dateTo must be a valid ISO datetime string",
  }),
});

export const couponPromotionConditionSchema = z.object({
  type: z.literal(PromotionType.COUPON),
});

export const customerSpecificPromotionConditionSchema = z.object({
  type: z.literal(PromotionType.CUSTOMER_SPECIFIC),
  customerId: z.uuid(),
});

export const promotionConditionSchema = z.discriminatedUnion("type", [
  seasonalPromotionConditionSchema,
  couponPromotionConditionSchema,
  customerSpecificPromotionConditionSchema,
]);

export type PromotionCondition = z.infer<typeof promotionConditionSchema>;

export const percentagePromotionEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.PERCENTAGE),
  value: z.number().min(0).max(100),
});

export const flatPromotionEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.FLAT),
  value: z.number().min(0),
});

export const promotionEffectSchema = z.discriminatedUnion("type", [
  percentagePromotionEffectSchema,
  flatPromotionEffectSchema,
]);

export type PromotionEffect = z.infer<typeof promotionEffectSchema>;

export const createPromotionSchema = z
  .object({
    name: z.string().min(1),
    type: promotionTypeSchema,
    priority: z.number().int().min(0),
    stackable: z.boolean(),
    condition: promotionConditionSchema,
    effect: promotionEffectSchema,
    target: promotionTargetSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== data.condition.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["condition"],
        message: `condition.type \"${data.condition.type}\" does not match promotion type \"${data.type}\"`,
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

export type CreatePromotionDto = z.infer<typeof createPromotionSchema>;
