import { TrackingMode } from "@repo/types";
import { z } from "zod";

export const assetLocationResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
});

export const assetProductTypeResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  trackingMode: z.enum(TrackingMode),
});

export const assetOwnerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const assetResponseSchema = z.object({
  id: z.uuid(),
  serialNumber: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  location: assetLocationResponseSchema,
  productType: assetProductTypeResponseSchema,
  owner: assetOwnerResponseSchema.nullable(),
});

export const getAssetsQuerySchema = z.object({
  locationId: z.uuid().optional(),
  productTypeId: z.uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export type AssetLocationResponse = z.infer<typeof assetLocationResponseSchema>;
export type AssetProductTypeResponse = z.infer<
  typeof assetProductTypeResponseSchema
>;
export type AssetOwnerResponse = z.infer<typeof assetOwnerResponseSchema>;
export type AssetResponse = z.infer<typeof assetResponseSchema>;
export type GetAssetsQuery = z.infer<typeof getAssetsQuerySchema>;
