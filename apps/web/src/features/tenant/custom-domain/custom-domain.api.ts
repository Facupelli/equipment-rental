import {
	type CustomDomainResponse,
	customDomainResponseSchema,
	type RegisterCustomDomainDto,
	type RegisterCustomDomainResponse,
	registerCustomDomainResponseSchema,
	registerCustomDomainSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch } from "@/lib/api";

const apiUrl = "/tenants/custom-domain";

export const getCustomDomain = createServerFn({ method: "GET" }).handler(
	async (): Promise<CustomDomainResponse | null> => {
		const result = await apiFetch<CustomDomainResponse | null>(apiUrl, {
			method: "GET",
		});

		return customDomainResponseSchema.nullable().parse(result);
	},
);

export const registerCustomDomain = createServerFn({ method: "POST" })
	.inputValidator((data: RegisterCustomDomainDto) =>
		registerCustomDomainSchema.parse(data),
	)
	.handler(async ({ data }): Promise<RegisterCustomDomainResponse> => {
		const result = await apiFetch<RegisterCustomDomainResponse>(apiUrl, {
			method: "POST",
			body: data,
		});

		return registerCustomDomainResponseSchema.parse(result);
	});

export const refreshCustomDomainStatus = createServerFn({ method: "POST" })
	.inputValidator((data: undefined) => z.void().parse(data))
	.handler(async (): Promise<CustomDomainResponse> => {
		const result = await apiFetch<CustomDomainResponse>(`${apiUrl}/refresh`, {
			method: "POST",
		});

		return customDomainResponseSchema.parse(result);
	});
