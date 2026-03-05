import { z } from "zod";

export const createAssetSchema = z.object({
  locationId: z.uuid(),
  productTypeId: z.uuid(),
  ownerId: z.uuid().nullable(),
  serialNumber: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAssetSchema = z.object({
  locationId: z.uuid().optional(),
  productTypeId: z.uuid().optional(),
  ownerId: z.uuid().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateAssetDto = z.infer<typeof createAssetSchema>;
export type UpdateAssetDto = z.infer<typeof updateAssetSchema>;
