import z from "zod";

export const AssetSchema = z.object({
  id: z.uuid(),
  locationId: z.uuid(),
  productTypeId: z.uuid(),
  ownerId: z.uuid().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
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
