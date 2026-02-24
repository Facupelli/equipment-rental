import { z } from "zod";

export const BillingIntervalSchema = z.enum([
  "monthly",
  "quarterly",
  "yearly",
  "one_time",
]);

export const createPricingTierSchema = z
  .object({
    productId: z.uuid(),
    inventoryItemId: z.uuid(),
    billingUnitId: z.string(),
    fromUnit: z.number().multipleOf(0.01).min(0).max(999.99),
    pricePerUnit: z.number().multipleOf(0.01).min(0).max(99999999.99),
    currency: z.string().length(3),
  })
  .strict();

export type CreatePricingTierDto = z.infer<typeof createPricingTierSchema>;
