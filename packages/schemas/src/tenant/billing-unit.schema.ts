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

export const SyncTenantBillingUnitsSchema = z.array(z.uuid());

export type TenantBillingUnit = z.infer<typeof TenantBillingUnitSchema>;
export type SyncTenantBillingUnits = z.infer<
  typeof SyncTenantBillingUnitsSchema
>;

// RESPONSE SCHEMAS

export const BillingUnitListResponseSchema = z.array(BillingUnitSchema);
export type BillingUnitListResponse = z.infer<
  typeof BillingUnitListResponseSchema
>;

export const TenantBillingUnitListResponseSchema = z.array(
  TenantBillingUnitSchema,
);
export type TenantBillingUnitListResponse = z.infer<
  typeof TenantBillingUnitListResponseSchema
>;
