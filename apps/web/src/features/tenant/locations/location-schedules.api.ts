import {
	type AddScheduleToLocationDto,
	addScheduleToLocationSchema,
	type GetLocationScheduleSlotsQueryDto,
	getLocationScheduleSlotsQuerySchema,
	type LocationScheduleResponseDto,
	LocationScheduleResponseSchema,
	type LocationScheduleSlotsResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { portalTenantMiddleware } from "@/features/tenant-context/portal-tenant.middleware";
import { authenticatedApiFetch as apiFetch } from "@/lib/api-auth";
import { storefrontApiFetch } from "@/lib/storefront-api";

const apiUrl = (locationId: string) => `/locations/${locationId}/schedules`;
const rentalApiUrl = (locationId: string) =>
	`/rental/locations/${locationId}/schedules`;

// ---------------------------------------------------------------------------

export const getLocationSchedules = createServerFn({ method: "GET" })
	.inputValidator((data: { locationId: string }) => data)
	.handler(async ({ data }): Promise<LocationScheduleResponseDto[]> => {
		const result = await apiFetch<unknown>(apiUrl(data.locationId), {
			method: "GET",
		});

		return z.array(LocationScheduleResponseSchema).parse(result);
	});

export const getRentalLocationSchedules = createServerFn({ method: "GET" })
	.middleware([portalTenantMiddleware])
	.inputValidator((data: { locationId: string }) => data)
	.handler(
		async ({ context, data }): Promise<LocationScheduleResponseDto[]> => {
			const result = await storefrontApiFetch<unknown>(
				context.tenantId,
				rentalApiUrl(data.locationId),
				{
					method: "GET",
				},
			);

			return z.array(LocationScheduleResponseSchema).parse(result);
		},
	);

const locationSlotsSchema = getLocationScheduleSlotsQuerySchema.extend({
	locationId: z.string(),
});

export const getLocationScheduleSlots = createServerFn({ method: "GET" })
	.middleware([portalTenantMiddleware])
	.inputValidator(
		(data: GetLocationScheduleSlotsQueryDto & { locationId: string }) =>
			locationSlotsSchema.parse(data),
	)
	.handler(
		async ({ context, data }): Promise<LocationScheduleSlotsResponse> => {
			const { locationId, ...params } = data;

			return storefrontApiFetch<LocationScheduleSlotsResponse>(
				context.tenantId,
				`${apiUrl(locationId)}/slots`,
				{
					method: "GET",
					params,
				},
			);
		},
	);

// ---------------------------------------------------------------------------

export const createLocationSchedule = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { locationId: string; dto: AddScheduleToLocationDto }) => ({
			locationId: data.locationId,
			dto: addScheduleToLocationSchema.parse(data.dto),
		}),
	)
	.handler(async ({ data }): Promise<LocationScheduleResponseDto> => {
		return apiFetch<LocationScheduleResponseDto>(apiUrl(data.locationId), {
			method: "POST",
			body: data.dto,
		});
	});

export const bulkCreateLocationSchedules = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { locationId: string; items: AddScheduleToLocationDto[] }) => ({
			locationId: data.locationId,
			items: z.array(addScheduleToLocationSchema).parse(data.items),
		}),
	)
	.handler(async ({ data }): Promise<LocationScheduleResponseDto[]> => {
		return apiFetch<LocationScheduleResponseDto[]>(
			`${apiUrl(data.locationId)}/bulk`,
			{
				method: "POST",
				body: { items: data.items },
			},
		);
	});

// ---------------------------------------------------------------------------

export const updateLocationSchedule = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			locationId: string;
			scheduleId: string;
			dto: AddScheduleToLocationDto;
		}) => ({
			locationId: data.locationId,
			scheduleId: data.scheduleId,
			dto: addScheduleToLocationSchema.parse(data.dto),
		}),
	)
	.handler(async ({ data }): Promise<LocationScheduleResponseDto> => {
		return apiFetch<LocationScheduleResponseDto>(
			`${apiUrl(data.locationId)}/${data.scheduleId}`,
			{
				method: "PATCH",
				body: data.dto,
			},
		);
	});
