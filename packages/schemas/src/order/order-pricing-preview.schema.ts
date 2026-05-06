import { FulfillmentMethod, PromotionAdjustmentType } from "@repo/types";
import { z } from "zod";
import {
  createOrderSchemaBase,
  orderItemSchema,
} from "./order.schema";

const moneyAmountStringSchema = z
  .string()
  .trim()
  .regex(
    /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    "Amount must be a valid positive decimal with up to 2 decimals",
  );

const orderPricingPreviewAdjustmentSchema = z.object({
  mode: z.literal("TARGET_TOTAL"),
  targetTotal: moneyAmountStringSchema,
});

export const orderPricingPreviewItemSchema = orderItemSchema.and(
  z.object({
    draftItemId: z.string().min(1),
    label: z.string().min(1),
  }),
);

export const orderPricingPreviewRequestSchema = createOrderSchemaBase
  .omit({
    items: true,
  })
  .extend({
    customerId: z.uuid().optional().nullable(),
    items: z
      .array(orderPricingPreviewItemSchema)
      .min(1, "At least one item is required"),
    pricingAdjustment: orderPricingPreviewAdjustmentSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.fulfillmentMethod === FulfillmentMethod.DELIVERY &&
      !value.deliveryRequest
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Delivery request is required when fulfillment method is DELIVERY",
        path: ["deliveryRequest"],
      });
    }

    if (
      value.fulfillmentMethod === FulfillmentMethod.PICKUP &&
      value.deliveryRequest
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Delivery request must be omitted when fulfillment method is PICKUP",
        path: ["deliveryRequest"],
      });
    }
  });

export const orderPricingPreviewDiscountLineSchema = z.object({
  sourceKind: z.literal("PROMOTION"),
  sourceId: z.string(),
  label: z.string(),
  promotionId: z.string(),
  promotionLabel: z.string(),
  type: z.enum(PromotionAdjustmentType),
  value: z.number(),
  discountAmount: z.string(),
});

export const orderPricingPreviewLineSchema = z.object({
  draftItemId: z.string(),
  type: z.enum(["PRODUCT", "BUNDLE"]),
  id: z.uuid(),
  label: z.string(),
  quantity: z.number().int().min(1),
  currency: z.string(),
  basePrice: z.string(),
  calculatedFinalPrice: z.string(),
  discountTotal: z.string(),
  discountLines: z.array(orderPricingPreviewDiscountLineSchema),
  effectiveFinalPrice: z.string(),
  adjustmentAmount: z.string(),
  adjustmentDirection: z.enum(["DISCOUNT", "SURCHARGE", "NONE"]),
  hasAdjustment: z.boolean(),
});

export const orderPricingPreviewResponseSchema = z.object({
  currency: z.string(),
  calculatedSubtotal: z.string(),
  effectiveSubtotal: z.string(),
  targetTotal: z.string().nullable(),
  adjustmentTotal: z.string(),
  adjustmentDirection: z.enum(["DISCOUNT", "SURCHARGE", "NONE"]),
  insuranceApplied: z.boolean(),
  insuranceAmount: z.string(),
  total: z.string(),
  totalBeforeDiscounts: z.string(),
  totalDiscount: z.string(),
  couponApplied: z.boolean(),
  lineItems: z.array(orderPricingPreviewLineSchema),
});

export type OrderPricingPreviewItemDto = z.infer<
  typeof orderPricingPreviewItemSchema
>;
export type OrderPricingPreviewRequestDto = z.infer<
  typeof orderPricingPreviewRequestSchema
>;
export type OrderPricingPreviewDiscountLineDto = z.infer<
  typeof orderPricingPreviewDiscountLineSchema
>;
export type OrderPricingPreviewLineDto = z.infer<
  typeof orderPricingPreviewLineSchema
>;
export type OrderPricingPreviewResponseDto = z.infer<
  typeof orderPricingPreviewResponseSchema
>;
