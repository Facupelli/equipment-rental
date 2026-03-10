import { z } from "zod";
import { TrackingMode } from "@repo/types";

export const productTypeAttributesSchema = z.record(z.string(), z.string());

export const productTypeIncludedItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
});

export const createProductTypeSchema = z.object({
  categoryId: z.uuid().nullable(),
  billingUnitId: z.uuid(),
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string(),
  description: z.string().nullable(),
  trackingMode: z.enum(TrackingMode),
  isActive: z.boolean().default(true),
  attributes: productTypeAttributesSchema,
  includedItems: z.array(productTypeIncludedItemSchema),
});

export const updateProductTypeSchema = z.object({
  categoryId: z.uuid().nullable().optional(),
  billingUnitId: z.uuid().optional(),
  name: z.string().min(1, "Name is required").optional(),
  imageUrl: z.string().optional(),
  description: z.string().nullable().optional(),
  trackingMode: z.enum(TrackingMode).optional(),
  isActive: z.boolean().optional(),
  attributes: productTypeAttributesSchema.optional(),
  includedItems: z.array(productTypeIncludedItemSchema).optional(),
});

export type ProductTypeAttributesDto = z.infer<
  typeof productTypeAttributesSchema
>;
export type ProductTypeIncludedItemDto = z.infer<
  typeof productTypeIncludedItemSchema
>;
export type CreateProductTypeDto = z.infer<typeof createProductTypeSchema>;
export type UpdateProductTypeDto = z.infer<typeof updateProductTypeSchema>;
