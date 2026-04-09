import type { TenantPricingConfig } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { resolveTenantContextServer } from "@/features/tenant-context/resolve-tenant-context";
import { apiFetch } from "@/lib/api";

async function getPortalTenantId(): Promise<string> {
	const tenantContext = await resolveTenantContextServer();

	if (tenantContext.face !== "portal") {
		throw new Error(
			"Portal customer auth is only available on tenant portal domains.",
		);
	}

	return tenantContext.tenant.id;
}

const apiUrl = "/tenant";

export const getTenantPricingConfig = createServerFn({ method: "GET" }).handler(
	async (): Promise<TenantPricingConfig> => {
		const tenantId = await getPortalTenantId();

		const result = await apiFetch<TenantPricingConfig>(
			`${apiUrl}/${tenantId}/pricing-config`,
			{
				authenticated: false,
				face: "portal",
				method: "GET",
			},
		);

		return result;
	},
);
