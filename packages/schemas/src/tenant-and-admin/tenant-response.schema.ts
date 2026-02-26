import { z } from "zod";
import { RoundingRule } from "@repo/types";

export const TenantPricingConfigSchema = z.object({
  overRentalEnabled: z.boolean(),
  maxOverRentThreshold: z.number(),
  weekendCountsAsOne: z.boolean(),
  roundingRule: z.enum(RoundingRule),
  defaultCurrency: z.string(),
});

export const BillingUnitResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  durationHours: z.number(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TenantResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  planTier: z.string(),
  isActive: z.boolean(),
  pricingConfig: TenantPricingConfigSchema,
  billingUnits: z.array(BillingUnitResponseSchema),
  createdAt: z.date(),
});

export type TenantResponseDto = z.infer<typeof TenantResponseSchema>;
export type BillingUnitResponseDto = z.infer<typeof BillingUnitResponseSchema>;
