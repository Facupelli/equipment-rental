import { RoundingRule } from "@repo/types";
import { z } from "zod";
import { bookingModeSchema } from "./tenant-response.schema";

const roundingRuleSchema = z.enum(RoundingRule);

const pricingPatchSchema = z.object({
  overRentalEnabled: z.boolean().optional(),
  maxOverRentThreshold: z.number().nonnegative().optional(),
  weekendCountsAsOne: z.boolean().optional(),
  roundingRule: roundingRuleSchema.optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code")
    .optional(),
  locale: z.string().optional(),
  insuranceEnabled: z.boolean().optional(),
  insuranceRatePercent: z.number().min(0).max(100).optional(),
});

export const updateTenantConfigSchema = z.object({
  pricing: pricingPatchSchema.optional(),
  timezone: z.string().optional(),
  newArrivalsWindowDays: z.number().int().positive().optional(),
  bookingMode: bookingModeSchema.optional(),
});

export type UpdateTenantConfigDto = z.infer<typeof updateTenantConfigSchema>;
