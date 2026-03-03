import z from "zod";

export const ProductTypeSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  categoryId: z.uuid().nullable().optional(),
  billingUnitId: z.uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  trackingMode: z.enum(["SERIAL", "BULK"]),
  isActive: z.boolean().default(true),
  attributes: z.record(z.string(), z.unknown()),
  includedItems: z.array(z.record(z.string(), z.unknown())).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export const ProductTypeCreateSchema = ProductTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const ProductTypeUpdateSchema = ProductTypeSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type ProductType = z.infer<typeof ProductTypeSchema>;
export type ProductTypeCreate = z.infer<typeof ProductTypeCreateSchema>;
export type ProductTypeUpdate = z.infer<typeof ProductTypeUpdateSchema>;
