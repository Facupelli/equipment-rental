import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
	getCustomersQuerySchema,
	type CustomerDetailResponseDto,
	type CustomerProfileResponseDto,
	type CustomerResponseDto,
	type GetCustomersQueryDto,
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

export interface CustomerParams {
	customerId: string;
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
		return apiFetch<CustomerProfileResponseDto>(
			`${apiUrl}/${data.customerId}/profile`,
			{ method: "GET" },
		);
	});
