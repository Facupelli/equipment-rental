import { RoundingRule } from "@repo/types";
import {
  updateTenantConfigSchema,
  type UpdateTenantConfigDto,
} from "@repo/schemas";
import { z } from "zod";

export const tenantConfigFormSchema = z.object({
  overRentalEnabled: z.boolean(),
  maxOverRentThreshold: z.number().nonnegative(),
  weekendCountsAsOne: z.boolean(),
  roundingRule: z.enum(RoundingRule),
  defaultCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code"),
  timezone: z.string().min(1, "Timezone is required"),
  newArrivalsWindowDays: z.number().int().positive(),
});

export type TenantConfigFormValues = z.infer<typeof tenantConfigFormSchema>;

export const tenantConfigFormDefaults: TenantConfigFormValues = {
  overRentalEnabled: false,
  maxOverRentThreshold: 0,
  weekendCountsAsOne: false,
  roundingRule: RoundingRule.ROUND_UP,
  defaultCurrency: "ARS",
  timezone: "UTC",
  newArrivalsWindowDays: 30,
};

export function tenantConfigToFormValues(config: {
  pricing: {
    overRentalEnabled: boolean;
    maxOverRentThreshold: number;
    weekendCountsAsOne: boolean;
    roundingRule: RoundingRule;
    defaultCurrency: string;
  };
  timezone: string;
  newArrivalsWindowDays: number;
}): TenantConfigFormValues {
  return {
    overRentalEnabled: config.pricing.overRentalEnabled,
    maxOverRentThreshold: config.pricing.maxOverRentThreshold,
    weekendCountsAsOne: config.pricing.weekendCountsAsOne,
    roundingRule: config.pricing.roundingRule,
    defaultCurrency: config.pricing.defaultCurrency,
    timezone: config.timezone,
    newArrivalsWindowDays: config.newArrivalsWindowDays,
  };
}

export function toUpdateTenantConfigDto(
  values: TenantConfigFormValues,
): UpdateTenantConfigDto {
  const dto = {
    pricing: {
      overRentalEnabled: values.overRentalEnabled,
      maxOverRentThreshold: values.maxOverRentThreshold,
      weekendCountsAsOne: values.weekendCountsAsOne,
      roundingRule: values.roundingRule,
      defaultCurrency: values.defaultCurrency,
    },
    timezone: values.timezone,
    newArrivalsWindowDays: values.newArrivalsWindowDays,
  };

  return updateTenantConfigSchema.parse(dto);
}
