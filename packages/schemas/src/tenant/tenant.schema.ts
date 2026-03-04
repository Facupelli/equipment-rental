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

// RESPNSE SCHEMAS

export const TenantWithBillingUnitsSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  config: z.record(z.string(), z.any()),
  billingUnits: z.array(
    z.object({
      id: z.uuid(),
      label: z.string(),
      durationMinutes: z.number().int(),
      sortOrder: z.number().int(),
    }),
  ),
});

export type TenantWithBillingUnits = z.infer<
  typeof TenantWithBillingUnitsSchema
>;
