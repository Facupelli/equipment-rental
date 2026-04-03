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
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const locationFormDefaults: LocationFormValues = {
	name: "",
	address: "",
	isActive: true,
};

export function locationToFormValues(location: {
	name: string;
	address: string | null;
	isActive: boolean;
}): LocationFormValues {
	return {
		name: location.name,
		address: location.address ?? "",
		isActive: location.isActive,
	};
}

export function toCreateLocationDto(
	values: LocationFormValues,
): CreateLocationDto {
	const dto = {
		name: values.name.trim(),
		address: emptyToNull(values.address),
		isActive: values.isActive,
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

	return updateLocationSchema.parse(dto);
}
