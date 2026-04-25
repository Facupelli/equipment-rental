import { PromotionAdjustmentType } from "@repo/types";
import { z } from "zod";

const moneyAmountStringSchema = z
  .string()
  .trim()
  .regex(
    /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    "Amount must be a valid positive decimal with up to 2 decimals",
  );

export const draftOrderDiscountLineSchema = z.object({
  sourceKind: z.enum(["PROMOTION", "MANUAL"]),
  sourceId: z.string(),
  label: z.string(),
  promotionId: z.string().nullable(),
  promotionLabel: z.string().nullable(),
  type: z.enum(PromotionAdjustmentType),
  value: z.number(),
  discountAmount: z.string(),
});

export const draftOrderPricingItemProposalSchema = z.object({
  orderItemId: z.uuid(),
  label: z.string(),
  currency: z.string(),
  basePrice: z.string(),
  currentFinalPrice: z.string(),
  proposedFinalPrice: z.string(),
  proposedDiscountAmount: z.string(),
});

export const draftOrderPricingProposalRequestSchema = z.object({
  targetTotal: moneyAmountStringSchema,
});

export const draftOrderPricingProposalResponseSchema = z.object({
  currency: z.string(),
  currentItemsSubtotal: z.string(),
  targetTotal: z.string(),
  proposedDiscountTotal: z.string(),
  items: z.array(draftOrderPricingItemProposalSchema),
});

export const draftOrderPricingItemUpdateSchema = z.object({
  orderItemId: z.uuid(),
  finalPrice: moneyAmountStringSchema,
});

export const updateDraftOrderPricingRequestSchema = z.discriminatedUnion(
  "mode",
  [
    z.object({
      mode: z.literal("TARGET_TOTAL"),
      targetTotal: moneyAmountStringSchema,
    }),
    z.object({
      mode: z.literal("ITEMS"),
      items: z.array(draftOrderPricingItemUpdateSchema).min(1),
    }),
  ],
);

export const getDraftOrderPricingParamSchema = z.object({
  orderId: z.uuid(),
});

export type DraftOrderDiscountLine = z.infer<
  typeof draftOrderDiscountLineSchema
>;
export type DraftOrderPricingItemProposalDto = z.infer<
  typeof draftOrderPricingItemProposalSchema
>;
export type DraftOrderPricingProposalRequestDto = z.infer<
  typeof draftOrderPricingProposalRequestSchema
>;
export type DraftOrderPricingProposalResponseDto = z.infer<
  typeof draftOrderPricingProposalResponseSchema
>;
export type DraftOrderPricingItemUpdateDto = z.infer<
  typeof draftOrderPricingItemUpdateSchema
>;
export type UpdateDraftOrderPricingRequestDto = z.infer<
  typeof updateDraftOrderPricingRequestSchema
>;
export type GetDraftOrderPricingParamDto = z.infer<
  typeof getDraftOrderPricingParamSchema
>;
