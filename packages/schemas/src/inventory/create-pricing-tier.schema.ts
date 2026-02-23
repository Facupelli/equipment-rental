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
    minDays: z.coerce.number().nonnegative("Price cannot be negative"),
    maxDays: z.coerce.number().nonnegative("Price cannot be negative"),
    pricePerDay: z.coerce.number().nonnegative("Price cannot be negative"),
  })
  .strict();

export type CreatePricingTierDto = z.infer<typeof createPricingTierSchema>;
