import z from "zod";
import { nullableOptional } from "../shared";
import { TrackingMode } from "@repo/types";

export const PricingTierSchema = z.object({
  id: z.uuid(),
  productTypeId: nullableOptional(z.uuid()),
  bundleId: nullableOptional(z.uuid()),
  locationId: nullableOptional(z.uuid()),
  fromUnit: z.number().int(),
  toUnit: nullableOptional(z.number().int()),
  pricePerUnit: z.number(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const PricingTierCreateSchema = PricingTierSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const PricingTierUpdateSchema = PricingTierSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type PricingTier = z.infer<typeof PricingTierSchema>;
export type PricingTierCreate = z.infer<typeof PricingTierCreateSchema>;
export type PricingTierUpdate = z.infer<typeof PricingTierUpdateSchema>;

// ----------------------------------------------------------

export const ProductTypeSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  categoryId: z.uuid().nullable().optional(),
  billingUnitId: z.uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  trackingMode: z.enum(TrackingMode),
  isActive: z.boolean().default(true),
  attributes: z.record(z.string(), z.unknown()),
  includedItems: z.array(z.record(z.string(), z.unknown())).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export const ProductTypeCreateSchema = z.object({
  categoryId: z.uuid(),
  billingUnitId: z.uuid(),
  name: z.string(),
  description: nullableOptional(z.string()),
  trackingMode: z.enum(TrackingMode),
  isActive: z.boolean().default(true),
  attributes: z.record(z.string(), z.unknown()),
  includedItems: z.array(z.record(z.string(), z.unknown())).default([]),
  pricingTiers: z.array(PricingTierCreateSchema),
});

export const ProductTypeUpdateSchema = ProductTypeSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type ProductType = z.infer<typeof ProductTypeSchema>;
export type ProductTypeCreate = z.infer<typeof ProductTypeCreateSchema>;
export type ProductTypeUpdate = z.infer<typeof ProductTypeUpdateSchema>;
