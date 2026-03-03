import z from "zod";

export const BillingUnitSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  durationMinutes: z.number().int(),
  sortOrder: z.number().int(),
});

export const BillingUnitCreateSchema = BillingUnitSchema.omit({
  id: true,
});

export const BillingUnitUpdateSchema = BillingUnitSchema.partial().omit({
  id: true,
});

export type BillingUnit = z.infer<typeof BillingUnitSchema>;
export type BillingUnitCreate = z.infer<typeof BillingUnitCreateSchema>;
export type BillingUnitUpdate = z.infer<typeof BillingUnitUpdateSchema>;

export const TenantBillingUnitSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  billingUnitId: z.uuid(),
});

export const TenantBillingUnitCreateSchema = TenantBillingUnitSchema.omit({
  id: true,
});

export const TenantBillingUnitUpdateSchema =
  TenantBillingUnitSchema.partial().omit({
    id: true,
    tenantId: true,
    billingUnitId: true,
  });

export type TenantBillingUnit = z.infer<typeof TenantBillingUnitSchema>;
export type TenantBillingUnitCreate = z.infer<
  typeof TenantBillingUnitCreateSchema
>;
export type TenantBillingUnitUpdate = z.infer<
  typeof TenantBillingUnitUpdateSchema
>;
