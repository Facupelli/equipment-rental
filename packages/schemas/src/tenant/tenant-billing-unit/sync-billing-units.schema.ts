import { z } from "zod";

export const syncTenantBillingUnitsSchema = z.object({
  billingUnitIds: z
    .array(z.uuid())
    .min(1, "At least one billing unit is required"),
});

export type SyncTenantBillingUnitsDto = z.infer<
  typeof syncTenantBillingUnitsSchema
>;
