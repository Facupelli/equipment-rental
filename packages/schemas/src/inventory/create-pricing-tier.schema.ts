import { z } from "zod";

export const CurrencySchema = z.string().regex(/^[A-Z]{3}$/, {
  message: "Currency must be a valid 3-letter ISO code (e.g., USD, EUR)",
});

export const MoneySchema = z.coerce.number().positive({
  message: "Price must be greater than 0",
});

export const UnitSchema = z.coerce.number().int().nonnegative({
  message: "Unit must be a non-negative integer",
});

export const createPricingTierSchema = z
  .object({
    billingUnitId: z.uuid(),
    fromUnit: UnitSchema,
    pricePerUnit: MoneySchema,
    currency: CurrencySchema,
  })
  .strict();

export type CreatePricingTierDto = z.infer<typeof createPricingTierSchema>;
