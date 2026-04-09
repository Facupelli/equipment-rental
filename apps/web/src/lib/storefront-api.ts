import type { PaginatedDto } from "@repo/schemas";
import { serverEnv } from "@/config/server-env";
import { resolveTenantContextServer } from "@/features/tenant-context/resolve-tenant-context";
import { apiFetchRaw, type ApiRequestOptions } from "./api-core";

async function getStorefrontHeaders(): Promise<Record<string, string>> {
	const tenantContext = await resolveTenantContextServer();

	if (tenantContext.face !== "portal") {
		throw new Error(
			"Storefront API requests are only available on tenant portal domains.",
		);
	}

	return {
		"x-internal-token": serverEnv.INTERNAL_API_TOKEN,
		"x-tenant-id": tenantContext.tenant.id,
	};
}

async function storefrontApiFetchRaw<T>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const storefrontHeaders = await getStorefrontHeaders();

	return apiFetchRaw<T>(path, {
		...options,
		headers: {
			...storefrontHeaders,
			...options.headers,
		},
	});
}

export async function storefrontApiFetch<T>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const body = await storefrontApiFetchRaw<{ data: T }>(path, options);
	return body?.data;
}

export async function storefrontApiFetchPaginated<T>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<PaginatedDto<T>> {
	return storefrontApiFetchRaw<PaginatedDto<T>>(path, options);
}
