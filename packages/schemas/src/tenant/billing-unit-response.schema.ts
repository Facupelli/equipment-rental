import { z } from "zod";

export const billingUnitResponseSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  durationMinutes: z.number().int(),
  sortOrder: z.number().int(),
});

export const billingUnitListResponseSchema = z.array(billingUnitResponseSchema);

export type BillingUnitResponse = z.infer<typeof billingUnitResponseSchema>;
export type BillingUnitListResponse = z.infer<
  typeof billingUnitListResponseSchema
>;
