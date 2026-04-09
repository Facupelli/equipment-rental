import {
	type TenantResponse,
	type UpdateTenantBrandingDto,
	type UpdateTenantConfigDto,
	updateTenantBrandingSchema,
	updateTenantConfigSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { authenticatedApiFetch } from "@/lib/api-auth";

const apiUrl = "/tenants";

export async function getCurrentTenantServer(): Promise<TenantResponse> {
	const result = await authenticatedApiFetch<TenantResponse>(`${apiUrl}/me`, {
		method: "GET",
	});

	return result;
}

export const getCurrentTenant = createServerFn({ method: "GET" }).handler(
	async (): Promise<TenantResponse> => getCurrentTenantServer(),
);

export const updateTenantConfig = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateTenantConfigDto) =>
		updateTenantConfigSchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		const result = await authenticatedApiFetch<string>(`${apiUrl}/config`, {
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
		await authenticatedApiFetch<void>(`${apiUrl}/branding`, {
			method: "PATCH",
			body: data,
		});
	});
