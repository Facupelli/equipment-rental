import { z } from "zod";

export const tenantBillingUnitResponseSchema = z.object({
  id: z.uuid(),
  billingUnitId: z.uuid(),
  label: z.string(),
});

export const tenantBillingUnitListResponseSchema = z.array(
  tenantBillingUnitResponseSchema,
);

export type TenantBillingUnitResponse = z.infer<
  typeof tenantBillingUnitResponseSchema
>;
export type TenantBillingUnitListResponse = z.infer<
  typeof tenantBillingUnitListResponseSchema
>;
