import { InventoryItemStatus, TrackingType } from "@repo/types";
import { z } from "zod";
import { IncludedItemSchema } from "./create-product.schema";

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const categorySummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const billingUnitSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  durationHours: z.number(),
});

const pricingTierDetailSchema = z.object({
  id: z.uuid(),
  fromUnit: z.number(),
  pricePerUnit: z.number(),
  currency: z.string().length(3),
  // null = product-level tier; set = item-level override
  inventoryItemId: z.string().uuid().nullable(),
  billingUnit: billingUnitSummarySchema,
});

const inventoryItemDetailSchema = z.object({
  id: z.uuid(),
  serialNumber: z.string().nullable(),
  totalQuantity: z.number().int().positive(),
  status: z.enum(InventoryItemStatus),
  location: z.object({ id: z.uuid(), name: z.string() }),
  owner: z.object({ id: z.uuid(), name: z.string() }),
  createdAt: z.coerce.date(),
});

// ---------------------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------------------

export const productDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  trackingType: z.enum(TrackingType),
  attributes: z.record(z.string(), z.unknown()),
  includedItems: z.array(IncludedItemSchema),
  category: categorySummarySchema.nullable(),
  pricingTiers: z.array(pricingTierDetailSchema),
  inventoryItems: z.array(inventoryItemDetailSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ProductDetailDto = z.infer<typeof productDetailSchema>;

export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type BillingUnitSummary = z.infer<typeof billingUnitSummarySchema>;
export type PricingTierDetail = z.infer<typeof pricingTierDetailSchema>;
export type InventoryItemDetail = z.infer<typeof inventoryItemDetailSchema>;

export {
  categorySummarySchema,
  billingUnitSummarySchema,
  pricingTierDetailSchema,
  inventoryItemDetailSchema,
};
