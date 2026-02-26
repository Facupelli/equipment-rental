import { z } from "zod";

export const createPricingTierSchema = z
  .object({
    billingUnitId: z.string(),
    fromUnit: z.coerce.number().multipleOf(0.01).min(0).max(999.99),
    pricePerUnit: z.coerce.number().multipleOf(0.01).min(0).max(99999999.99),
    currency: z.string().length(3),
  })
  .strict();

export type CreatePricingTierDto = z.infer<typeof createPricingTierSchema>;
