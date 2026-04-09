import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
	CustomerProfileResponseSchema,
	getPendingCustomerProfilesResponseSchema,
	getCustomersQuerySchema,
	pendingCustomerProfileReviewCountResponseSchema,
	type CustomerDetailResponseDto,
	type CustomerProfileResponseDto,
	type CustomerResponseDto,
	type GetPendingCustomerProfilesResponseDto,
	type GetCustomersQueryDto,
	type PendingCustomerProfileReviewCountResponseDto,
	type PaginatedDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const apiUrl = "/customers";

export const getCustomers = createServerFn({ method: "GET" })
	.inputValidator((data: GetCustomersQueryDto) =>
		getCustomersQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<PaginatedDto<CustomerResponseDto>> => {
		const result = await apiFetchPaginated<CustomerResponseDto>(apiUrl, {
			method: "GET",
			params: data,
		});

		return result;
	});

const customerParamsSchema = z.object({
	customerId: z.uuid(),
});

const customerProfileParamsSchema = z.object({
	customerProfileId: z.uuid(),
});

export interface CustomerParams {
	customerId: string;
}

export interface CustomerProfileParams {
	customerProfileId: string;
}

export const getCustomerDetail = createServerFn({ method: "GET" })
	.inputValidator((data: CustomerParams) => customerParamsSchema.parse(data))
	.handler(async ({ data }): Promise<CustomerDetailResponseDto> => {
		return apiFetch<CustomerDetailResponseDto>(`${apiUrl}/${data.customerId}`, {
			method: "GET",
		});
	});

export const getCustomerProfile = createServerFn({ method: "GET" })
	.inputValidator((data: CustomerParams) => customerParamsSchema.parse(data))
	.handler(async ({ data }): Promise<CustomerProfileResponseDto> => {
		const result = await apiFetch<CustomerProfileResponseDto>(
			`${apiUrl}/${data.customerId}/profile`,
			{ method: "GET" },
		);

		return CustomerProfileResponseSchema.parse(result);
	});

export const getPendingCustomerProfiles = createServerFn({
	method: "GET",
}).handler(async (): Promise<GetPendingCustomerProfilesResponseDto> => {
	const result = await apiFetch<GetPendingCustomerProfilesResponseDto>(
		"/customer-profiles/pending",
		{
			method: "GET",
		},
	);

	return getPendingCustomerProfilesResponseSchema.parse(result);
});

export const getPendingCustomerProfileReviewCount = createServerFn({
	method: "GET",
}).handler(async (): Promise<PendingCustomerProfileReviewCountResponseDto> => {
	const result = await apiFetch<PendingCustomerProfileReviewCountResponseDto>(
		"/customer-profiles/pending/count",
		{
			method: "GET",
		},
	);

	return pendingCustomerProfileReviewCountResponseSchema.parse(result);
});

export const getCustomerProfileReview = createServerFn({ method: "GET" })
	.inputValidator((data: CustomerProfileParams) =>
		customerProfileParamsSchema.parse(data),
	)
	.handler(async ({ data }): Promise<CustomerProfileResponseDto> => {
		const result = await apiFetch<CustomerProfileResponseDto>(
			`/customer-profiles/${data.customerProfileId}`,
			{ method: "GET" },
		);

		return CustomerProfileResponseSchema.parse(result);
	});
