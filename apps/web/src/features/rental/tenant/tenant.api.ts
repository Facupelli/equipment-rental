import type { TenantPricingConfig } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { portalTenantMiddleware } from "@/features/tenant-context/portal-tenant.middleware";
import { storefrontApiFetch } from "@/lib/storefront-api";

const apiUrl = "/tenant";

export const getTenantPricingConfig = createServerFn({ method: "GET" })
	.middleware([portalTenantMiddleware])
	.handler(async ({ context }): Promise<TenantPricingConfig> => {
		const result = await storefrontApiFetch<TenantPricingConfig>(
			context.tenantId,
			`${apiUrl}/${context.tenantId}/pricing-config`,
			{
				method: "GET",
			},
		);

		return result;
	});
