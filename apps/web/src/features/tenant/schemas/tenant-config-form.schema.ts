import { BookingMode, RoundingRule } from "@repo/types";
import {
	updateTenantConfigSchema,
	type UpdateTenantConfigDto,
} from "@repo/schemas";
import { z } from "zod";

const bookingModeSchema = z.enum(BookingMode);

export const tenantConfigFormSchema = z.object({
	overRentalEnabled: z.boolean(),
	maxOverRentThreshold: z.number().nonnegative(),
	weekendCountsAsOne: z.boolean(),
	roundingRule: z.enum(RoundingRule),
	currency: z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code"),
	locale: z.string(),
	timezone: z.string().min(1, "Timezone is required"),
	newArrivalsWindowDays: z.number().int().positive(),
	bookingMode: bookingModeSchema,
});

export type TenantConfigFormValues = z.infer<typeof tenantConfigFormSchema>;

export const tenantConfigFormDefaults: TenantConfigFormValues = {
	overRentalEnabled: false,
	maxOverRentThreshold: 0,
	weekendCountsAsOne: false,
	roundingRule: RoundingRule.ROUND_UP,
	currency: "ARS",
	locale: "es-AR",
	timezone: "UTC",
	newArrivalsWindowDays: 30,
	bookingMode: BookingMode.INSTANT_BOOK,
};

export function tenantConfigToFormValues(config: {
	pricing: {
		overRentalEnabled: boolean;
		maxOverRentThreshold: number;
		weekendCountsAsOne: boolean;
		roundingRule: RoundingRule;
		currency: string;
		locale: string;
	};
	timezone: string;
	newArrivalsWindowDays: number;
	bookingMode: BookingMode;
}): TenantConfigFormValues {
	return {
		overRentalEnabled: config.pricing.overRentalEnabled,
		maxOverRentThreshold: config.pricing.maxOverRentThreshold,
		weekendCountsAsOne: config.pricing.weekendCountsAsOne,
		roundingRule: config.pricing.roundingRule,
		currency: config.pricing.currency,
		locale: config.pricing.locale,
		timezone: config.timezone,
		newArrivalsWindowDays: config.newArrivalsWindowDays,
		bookingMode: config.bookingMode,
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
			currency: values.currency,
			locale: values.locale,
		},
		timezone: values.timezone,
		newArrivalsWindowDays: values.newArrivalsWindowDays,
		bookingMode: values.bookingMode,
	};

	return updateTenantConfigSchema.parse(dto);
}
