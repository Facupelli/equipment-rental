import z from "zod";
import { nullableOptional } from "../shared";

export const AssetSchema = z.object({
  id: z.uuid(),
  locationId: z.uuid(),
  productTypeId: z.uuid(),
  ownerId: nullableOptional(z.uuid()),
  serialNumber: nullableOptional(z.string()),
  notes: nullableOptional(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  deletedAt: nullableOptional(z.date()),
});

export const AssetCreateSchema = AssetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const AssetUpdateSchema = AssetSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type Asset = z.infer<typeof AssetSchema>;
export type AssetCreate = z.infer<typeof AssetCreateSchema>;
export type AssetUpdate = z.infer<typeof AssetUpdateSchema>;

// ----------------------------------------------------------
// Response schemas (with relations)

const LocationResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable().optional(),
});

const ProductTypeResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  trackingMode: z.enum(["IDENTIFIED", "POOLED"]),
});

const OwnerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const AssetResponseSchema = AssetSchema.extend({
  location: LocationResponseSchema,
  productType: ProductTypeResponseSchema,
  owner: OwnerResponseSchema.nullable().optional(),
}).omit({
  locationId: true,
  productTypeId: true,
  ownerId: true,
});

export const AssetListResponseSchema = z.array(AssetResponseSchema);

export type AssetResponse = z.infer<typeof AssetResponseSchema>;
export type AssetListResponse = z.infer<typeof AssetListResponseSchema>;

// ----------------------------------------------------------
// Query schemas

export const GetAssetsQuerySchema = z.object({
  locationId: z.uuid().optional(),
  productTypeId: z.uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type GetAssetsQuery = z.infer<typeof GetAssetsQuerySchema>;
