import z from "zod";

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
