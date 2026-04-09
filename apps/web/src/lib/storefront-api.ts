import type { PaginatedDto } from "@repo/schemas";
import { serverEnv } from "@/config/server-env";
import { resolveTenantContextByHostname } from "@/features/tenant-context/tenant-context.service";
import { requestJson, type ApiRequestOptions } from "./api";

type StorefrontApiRequestOptions = ApiRequestOptions;

async function getStorefrontHeaders(): Promise<Record<string, string>> {
	const tenantContext = await resolveTenantContextByHostname();

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
	options: StorefrontApiRequestOptions,
): Promise<T> {
	const storefrontHeaders = await getStorefrontHeaders();

	return requestJson<T>(path, {
		...options,
		headers: {
			...options.headers,
			...storefrontHeaders,
		},
	});
}

export async function storefrontApiFetch<T>(
	path: string,
	options: StorefrontApiRequestOptions,
): Promise<T> {
	const body = await storefrontApiFetchRaw<{ data: T }>(path, options);
	return body?.data;
}

export async function storefrontApiFetchPaginated<T>(
	path: string,
	options: StorefrontApiRequestOptions,
): Promise<PaginatedDto<T>> {
	return storefrontApiFetchRaw<PaginatedDto<T>>(path, options);
}
