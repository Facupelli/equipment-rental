import {
	type CustomerProfile,
	type CustomerProfileResponseDto,
	customerProfileSchema,
	type MeCustomerResponseDto,
	type ProblemDetails,
} from "@repo/schemas";
import { ActorType } from "@repo/types";
import { createServerFn } from "@tanstack/react-start";
import { authenticatedApiFetch as apiFetch } from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/customers";

export const getMeCustomer = createServerFn({ method: "GET" }).handler(
	async ({ data }): Promise<MeCustomerResponseDto> => {
		const result = await apiFetch<MeCustomerResponseDto>(`${apiUrl}/me`, {
			method: "GET",
			params: data,
			redirectTo: "/login",
			actorType: ActorType.CUSTOMER,
		});

		return result;
	},
);

export const getCurrentCustomerProfile = createServerFn({
	method: "GET",
}).handler(async (): Promise<CustomerProfileResponseDto> => {
	return apiFetch<CustomerProfileResponseDto>("/customer-profile", {
		method: "GET",
		redirectTo: "/login",
		actorType: ActorType.CUSTOMER,
	});
});

export const submitCustomerProfile = createServerFn({ method: "POST" })
	.inputValidator((data: CustomerProfile) => customerProfileSchema.parse(data))
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>("/customer-profile", {
				method: "POST",
				body: data,
				redirectTo: "/login",
				actorType: ActorType.CUSTOMER,
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
				redirectTo: "/login",
				actorType: ActorType.CUSTOMER,
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});
