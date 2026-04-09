import {
	type CreateLocationDto,
	createLocationSchema,
	type LocationListResponse,
	type RentalLocationsResponse,
	type UpdateLocationDto,
	updateLocationSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { storefrontApiFetch } from "@/lib/storefront-api";

const apiUrl = "/locations";

export const createLocation = createServerFn({ method: "POST" })
	.inputValidator((data: CreateLocationDto) => createLocationSchema.parse(data))
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});

		return result;
	});

export const updateLocation = createServerFn({ method: "POST" })
	.inputValidator((data: { locationId: string; dto: UpdateLocationDto }) => ({
		locationId: data.locationId,
		dto: updateLocationSchema.parse(data.dto),
	}))
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.locationId}`, {
			method: "PATCH",
			body: data.dto,
		});
	});

export const deactivateLocation = createServerFn({ method: "POST" })
	.inputValidator((data: { locationId: string }) => data)
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.locationId}/deactivate`, {
			method: "PATCH",
		});
	});

export const getLocations = createServerFn({ method: "GET" }).handler(
	async (): Promise<LocationListResponse> => {
		const result = await apiFetch<LocationListResponse>(apiUrl, {
			method: "GET",
		});

		return result;
	},
);

export const getRentalLocations = createServerFn({ method: "GET" }).handler(
	async (): Promise<RentalLocationsResponse> => {
		const result = await storefrontApiFetch<RentalLocationsResponse>(
			"/rental/locations",
			{
				method: "GET",
			},
		);

		return result;
	},
);
