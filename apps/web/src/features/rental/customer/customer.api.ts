import {
	type CustomerProfile,
	type CustomerProfileResponseDto,
	customerProfileSchema,
	type MeCustomerResponseDto,
	type ProblemDetails,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/customers";

export const getMeCustomer = createServerFn({ method: "GET" }).handler(
	async ({ data }): Promise<MeCustomerResponseDto> => {
		const result = await apiFetch<MeCustomerResponseDto>(`${apiUrl}/me`, {
			method: "GET",
			params: data,
			face: "portal",
		});

		return result;
	},
);

export const getCurrentCustomerProfile = createServerFn({
	method: "GET",
}).handler(async (): Promise<CustomerProfileResponseDto> => {
	return apiFetch<CustomerProfileResponseDto>("/customer-profile", {
		method: "GET",
		face: "portal",
	});
});

export const submitCustomerProfile = createServerFn({ method: "POST" })
	.inputValidator((data: CustomerProfile) => customerProfileSchema.parse(data))
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>("/customer-profile", {
				method: "POST",
				body: data,
				face: "portal",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});

export const resubmitCustomerProfile = createServerFn({ method: "POST" })
	.inputValidator((data: CustomerProfile) => customerProfileSchema.parse(data))
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>("/customer-profile", {
				method: "PUT",
				body: data,
				face: "portal",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});
