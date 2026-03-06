import { z } from "zod";
import {
  productTypeAttributesSchema,
  productTypeIncludedItemSchema,
} from "./product-type.schema";
import { TrackingMode } from "@repo/types";

export const productTypeCategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
});

export const productTypeBillingUnitResponseSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  durationMinutes: z.number().int(),
  sortOrder: z.number().int(),
});

export const productTypePricingTierResponseSchema = z.object({
  id: z.uuid(),
  productTypeId: z.uuid().nullable(),
  bundleId: z.uuid().nullable(),
  locationId: z.uuid().nullable(),
  fromUnit: z.number().int(),
  toUnit: z.number().int().nullable(),
  pricePerUnit: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const productTypeResponseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  trackingMode: z.enum(TrackingMode),
  isActive: z.boolean(),
  attributes: productTypeAttributesSchema,
  includedItems: z.array(productTypeIncludedItemSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  category: productTypeCategoryResponseSchema.nullable(),
  billingUnit: productTypeBillingUnitResponseSchema,
  pricingTiers: z.array(productTypePricingTierResponseSchema),
});

export const getProductTypesQuerySchema = z.object({
  categoryId: z.uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export type ProductTypeCategoryResponse = z.infer<
  typeof productTypeCategoryResponseSchema
>;
export type ProductTypeBillingUnitResponse = z.infer<
  typeof productTypeBillingUnitResponseSchema
>;
export type ProductTypePricingTierResponse = z.infer<
  typeof productTypePricingTierResponseSchema
>;
export type ProductTypeResponse = z.infer<typeof productTypeResponseSchema>;
export type GetProductTypesQuery = z.infer<typeof getProductTypesQuerySchema>;

// RENTAL

export const rentalProductBillingUnitResponseSchema = z.object({
  id: z.uuid(),
  label: z.string(),
});

export const rentalProductPricingTierResponseSchema = z.object({
  id: z.uuid(),
  fromUnit: z.number().int(),
  toUnit: z.number().int().nullable(),
  pricePerUnit: z.number(),
});

const rentalProductCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const rentalProductItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  attributes: productTypeAttributesSchema,
  includedItems: z.array(productTypeIncludedItemSchema),
  availableCount: z.number().int().min(1),
  category: rentalProductCategorySchema.nullable(),
  billingUnit: rentalProductBillingUnitResponseSchema,
  pricingTiers: z.array(rentalProductPricingTierResponseSchema),
});

export const getRentalProductQuerySchema = z.object({
  locationId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const rentalProductDataSchema = z.array(rentalProductItemSchema);

export type RentalProductResponse = z.infer<typeof rentalProductItemSchema>;
export type RentalProductListResponse = z.infer<typeof rentalProductDataSchema>;
export type GetRentalProductTypesQuery = z.infer<
  typeof getRentalProductQuerySchema
>;
