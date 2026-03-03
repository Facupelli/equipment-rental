import z from "zod";

export const OwnerSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const OwnerCreateSchema = OwnerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const OwnerUpdateSchema = OwnerSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type Owner = z.infer<typeof OwnerSchema>;
export type OwnerCreate = z.infer<typeof OwnerCreateSchema>;
export type OwnerUpdate = z.infer<typeof OwnerUpdateSchema>;
