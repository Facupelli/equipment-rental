import {
  PromotionActivationType,
  PromotionApplicabilityTarget,
  PromotionConditionType,
  PromotionEffectType,
  PromotionStackingType,
} from "@repo/types";
import { z } from "zod";

export const promotionActivationTypeSchema = z.enum(PromotionActivationType);
export const promotionStackingTypeSchema = z.enum(PromotionStackingType);
export const promotionApplicabilityTargetSchema = z.enum(
  PromotionApplicabilityTarget,
);
export const promotionConditionTypeSchema = z.enum(PromotionConditionType);
export const promotionEffectTypeSchema = z.enum(PromotionEffectType);

export const promotionApplicabilitySchema = z.object({
  appliesTo: z.array(promotionApplicabilityTargetSchema).min(1),
  excludedProductTypeIds: z.array(z.uuid()).default([]),
  excludedBundleIds: z.array(z.uuid()).default([]),
});

export const bookingWindowPromotionConditionSchema = z.object({
  type: z.literal(PromotionConditionType.BOOKING_WINDOW),
  from: z.iso.datetime({ message: "from must be a valid ISO datetime string" }),
  to: z.iso.datetime({ message: "to must be a valid ISO datetime string" }),
});

export const rentalWindowPromotionConditionSchema = z.object({
  type: z.literal(PromotionConditionType.RENTAL_WINDOW),
  from: z.iso.datetime({ message: "from must be a valid ISO datetime string" }),
  to: z.iso.datetime({ message: "to must be a valid ISO datetime string" }),
});

export const customerIdInPromotionConditionSchema = z.object({
  type: z.literal(PromotionConditionType.CUSTOMER_ID_IN),
  customerIds: z.array(z.uuid()).min(1),
});

export const minSubtotalPromotionConditionSchema = z.object({
  type: z.literal(PromotionConditionType.MIN_SUBTOTAL),
  amount: z.number().positive(),
  currency: z.string().length(3),
});

export const rentalDurationMinPromotionConditionSchema = z.object({
  type: z.literal(PromotionConditionType.RENTAL_DURATION_MIN),
  minUnits: z.number().int().positive(),
});

export const categoryItemQuantityPromotionConditionSchema = z.object({
  type: z.literal(PromotionConditionType.CATEGORY_ITEM_QUANTITY),
  categoryId: z.uuid(),
  minQuantity: z.number().int().positive(),
});

export const distinctCategoriesWithMinQuantityPromotionConditionSchema =
  z.object({
    type: z.literal(
      PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY,
    ),
    categoryIds: z.array(z.uuid()).min(1),
    minCategoriesMatched: z.number().int().positive(),
    minQuantityPerCategory: z.number().int().positive(),
  });

export const promotionConditionSchema = z.discriminatedUnion("type", [
  bookingWindowPromotionConditionSchema,
  rentalWindowPromotionConditionSchema,
  customerIdInPromotionConditionSchema,
  minSubtotalPromotionConditionSchema,
  rentalDurationMinPromotionConditionSchema,
  categoryItemQuantityPromotionConditionSchema,
  distinctCategoriesWithMinQuantityPromotionConditionSchema,
]);

export type PromotionCondition = z.infer<typeof promotionConditionSchema>;

export const percentOffPromotionEffectSchema = z.object({
  type: z.literal(PromotionEffectType.PERCENT_OFF),
  percentage: z.number().positive().max(100),
});

export const longRentalTieredPercentOffPromotionEffectSchema = z
  .object({
    type: z.literal(PromotionEffectType.LONG_RENTAL_TIERED_PERCENT_OFF),
    tiers: z
      .array(
        z.object({
          fromUnits: z.number().int().positive(),
          toUnits: z.number().int().positive().nullable(),
          percentage: z.number().positive().max(100),
        }),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.tiers.length; i++) {
      const tier = data.tiers[i];

      if (tier.toUnits !== null && tier.toUnits < tier.fromUnits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiers", i, "toUnits"],
          message: "toUnits must be greater than or equal to fromUnits",
        });
      }

      if (i > 0) {
        const previous = data.tiers[i - 1];
        const previousEnd = previous.toUnits ?? Number.POSITIVE_INFINITY;
        if (tier.fromUnits <= previousEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tiers", i, "fromUnits"],
            message: "tiers must not overlap",
          });
        }
      }
    }

    const lastTier = data.tiers[data.tiers.length - 1];
    if (lastTier.toUnits !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tiers", data.tiers.length - 1, "toUnits"],
        message: "the last tier must be open-ended",
      });
    }
  });

export const promotionEffectSchema = z.discriminatedUnion("type", [
  percentOffPromotionEffectSchema,
  longRentalTieredPercentOffPromotionEffectSchema,
]);

export type PromotionEffect = z.infer<typeof promotionEffectSchema>;

export const createPromotionSchema = z
  .object({
    name: z.string().min(1),
    activationType: promotionActivationTypeSchema,
    priority: z.number().int().min(0),
    stackingType: promotionStackingTypeSchema,
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    conditions: z.array(promotionConditionSchema).default([]),
    applicability: promotionApplicabilitySchema,
    effect: promotionEffectSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.validFrom &&
      data.validUntil &&
      data.validFrom >= data.validUntil
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "validUntil must be strictly after validFrom",
      });
    }

    for (const [index, condition] of data.conditions.entries()) {
      if (
        (condition.type === PromotionConditionType.BOOKING_WINDOW ||
          condition.type === PromotionConditionType.RENTAL_WINDOW) &&
        condition.from >= condition.to
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["conditions", index, "to"],
          message: "to must be strictly after from",
        });
      }
    }
  });

export type CreatePromotionDto = z.infer<typeof createPromotionSchema>;
