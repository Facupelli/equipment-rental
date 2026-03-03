import z from "zod";

export const TenantSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  config: z.record(z.string(), z.unknown()),
});

export const TenantCreateSchema = TenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  config: true,
  slug: true,
});

export const TenantUpdateSchema = TenantSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type Tenant = z.infer<typeof TenantSchema>;
export type TenantCreate = z.infer<typeof TenantCreateSchema>;
export type TenantUpdate = z.infer<typeof TenantUpdateSchema>;
