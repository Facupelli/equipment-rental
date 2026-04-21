import { z } from "zod";

function isValidIanaTimezone(timezone: string): boolean {
	if (timezone === "UTC") {
		return true;
	}

	return Intl.supportedValuesOf("timeZone").includes(timezone);
}

const timezoneSchema = z
	.string()
	.trim()
	.min(1, "Timezone is required")
	.refine(isValidIanaTimezone, "Timezone must be a valid IANA timezone");

const emptyLocationDeliveryDefaults = {
  country: null,
  stateRegion: null,
  city: null,
  postalCode: null,
} as const;

export const locationDeliveryDefaultsSchema = z.object({
  country: z.string().nullable(),
  stateRegion: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().nullable(),
  timezone: timezoneSchema.nullable().default(null),
  isActive: z.boolean().default(true),
  supportsDelivery: z.boolean().default(false),
  deliveryDefaults: locationDeliveryDefaultsSchema.default(
    emptyLocationDeliveryDefaults,
  ),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().nullable().optional(),
  timezone: timezoneSchema.nullable().optional(),
  supportsDelivery: z.boolean().optional(),
  deliveryDefaults: locationDeliveryDefaultsSchema.optional(),
});

export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
