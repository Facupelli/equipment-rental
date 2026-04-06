import {
	type TenantResponse,
	type UpdateTenantBrandingDto,
	type UpdateTenantConfigDto,
	updateTenantBrandingSchema,
	updateTenantConfigSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";

const apiUrl = "/tenants";

export const getCurrentTenant = createServerFn({ method: "GET" }).handler(
	async (): Promise<TenantResponse> => {
		const result = await apiFetch<TenantResponse>(`${apiUrl}/me`, {
			method: "GET",
		});

		return result;
	},
);

export const updateTenantConfig = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateTenantConfigDto) =>
		updateTenantConfigSchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(`${apiUrl}/config`, {
			method: "PATCH",
			body: data,
		});

		return result;
	});

export const updateTenantBranding = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateTenantBrandingDto) =>
		updateTenantBrandingSchema.parse(data),
	)
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/branding`, {
			method: "PATCH",
			body: data,
		});
	});
