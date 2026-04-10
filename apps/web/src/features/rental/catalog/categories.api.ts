import type { ProductCategoryListResponse } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { portalTenantMiddleware } from "@/features/tenant-context/portal-tenant.middleware";

import { storefrontApiFetch } from "@/lib/storefront-api";

const apiUrl = "/rental/categories";

export const getRentalCategories = createServerFn({ method: "GET" })
	.middleware([portalTenantMiddleware])
	.handler(async ({ context }): Promise<ProductCategoryListResponse> => {
		const result = await storefrontApiFetch<ProductCategoryListResponse>(
			context.tenantId,
			apiUrl,
			{
				method: "GET",
			},
		);

		return result;
	});
