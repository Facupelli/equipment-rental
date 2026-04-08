import {
	type CreateLocationDto,
	createLocationSchema,
	type UpdateLocationDto,
	updateLocationSchema,
} from "@repo/schemas";
import { z } from "zod";
import { emptyToNull, emptyToNullOrUndefined } from "@/shared/utils/form.utils";

export const locationFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	address: z.string().or(z.literal("")),
	isActive: z.boolean(),
	supportsDelivery: z.boolean(),
	deliveryDefaults: z.object({
		country: z.string().or(z.literal("")),
		stateRegion: z.string().or(z.literal("")),
		city: z.string().or(z.literal("")),
		postalCode: z.string().or(z.literal("")),
	}),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const locationFormDefaults: LocationFormValues = {
	name: "",
	address: "",
	isActive: true,
	supportsDelivery: false,
	deliveryDefaults: {
		country: "",
		stateRegion: "",
		city: "",
		postalCode: "",
	},
};

export function locationToFormValues(location: {
	name: string;
	address: string | null;
	isActive: boolean;
	supportsDelivery: boolean;
	deliveryDefaults: {
		country: string | null;
		stateRegion: string | null;
		city: string | null;
		postalCode: string | null;
	} | null;
}): LocationFormValues {
	return {
		name: location.name,
		address: location.address ?? "",
		isActive: location.isActive,
		supportsDelivery: location.supportsDelivery,
		deliveryDefaults: {
			country: location.deliveryDefaults?.country ?? "",
			stateRegion: location.deliveryDefaults?.stateRegion ?? "",
			city: location.deliveryDefaults?.city ?? "",
			postalCode: location.deliveryDefaults?.postalCode ?? "",
		},
	};
}

export function toCreateLocationDto(
	values: LocationFormValues,
): CreateLocationDto {
	const dto = {
		name: values.name.trim(),
		address: emptyToNull(values.address),
		isActive: values.isActive,
		supportsDelivery: values.supportsDelivery,
		deliveryDefaults: {
			country: emptyToNull(values.deliveryDefaults.country),
			stateRegion: emptyToNull(values.deliveryDefaults.stateRegion),
			city: emptyToNull(values.deliveryDefaults.city),
			postalCode: emptyToNull(values.deliveryDefaults.postalCode),
		},
	};

	return createLocationSchema.parse(dto);
}

export function toUpdateLocationDto(
	dirtyValues: Partial<LocationFormValues>,
): UpdateLocationDto {
	const dto: UpdateLocationDto = {};

	if (dirtyValues.name !== undefined) {
		dto.name = dirtyValues.name.trim();
	}
	if (dirtyValues.address !== undefined) {
		dto.address = emptyToNullOrUndefined(dirtyValues.address);
	}
	if (dirtyValues.supportsDelivery !== undefined) {
		dto.supportsDelivery = dirtyValues.supportsDelivery;
	}
	if (dirtyValues.deliveryDefaults !== undefined) {
		dto.deliveryDefaults = {
			country:
				emptyToNullOrUndefined(dirtyValues.deliveryDefaults.country) ?? null,
			stateRegion:
				emptyToNullOrUndefined(dirtyValues.deliveryDefaults.stateRegion) ??
				null,
			city: emptyToNullOrUndefined(dirtyValues.deliveryDefaults.city) ?? null,
			postalCode:
				emptyToNullOrUndefined(dirtyValues.deliveryDefaults.postalCode) ?? null,
		};
	}

	return updateLocationSchema.parse(dto);
}
