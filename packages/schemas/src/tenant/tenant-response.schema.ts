import { BookingMode, RoundingRule } from "@repo/types";
import { z } from "zod";

export const roundingRuleSchema = z.enum(RoundingRule);
export const bookingModeSchema = z.enum(BookingMode);

export const tenantPricingConfigSchema = z.object({
  overRentalEnabled: z.boolean(),
  maxOverRentThreshold: z.number(),
  weekendCountsAsOne: z.boolean(),
  roundingRule: roundingRuleSchema,
  defaultCurrency: z.string(),
});

export const tenantConfigSchema = z.object({
  pricing: tenantPricingConfigSchema,
  timezone: z.string(),
  newArrivalsWindowDays: z.number().int().positive(),
  bookingMode: bookingModeSchema.default(BookingMode.INSTANT_BOOK),
});

const tenantBillingUnitResponseSchema = z.object({
  id: z.uuid(),
  billingUnitId: z.uuid(),
  label: z.string(),
  durationMinutes: z.number().int(),
  sortOrder: z.number().int(),
});

export const tenantResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.coerce.date(),
  config: tenantConfigSchema,
  billingUnits: z.array(tenantBillingUnitResponseSchema),
});

export type TenantPricingConfig = z.infer<typeof tenantPricingConfigSchema>;
export type TenantConfig = z.infer<typeof tenantConfigSchema>;

export type TenantResponse = z.infer<typeof tenantResponseSchema>;
