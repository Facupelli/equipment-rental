import type {
	UpdateTenantBrandingDto,
	UpdateTenantConfigDto,
} from "@repo/schemas";
import {
	queryOptions,
	type UseMutationOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { ProblemDetailsError } from "@/shared/errors";
import {
	getCurrentTenant,
	updateTenantBranding,
	updateTenantConfig,
} from "./tenant.api";

// -------------------------------------------------------
// Key Factory
// -------------------------------------------------------

export const tenantKeys = {
	all: () => ["tenant"] as const,
	me: () => [...tenantKeys.all(), "me"] as const,
};

export const tenantQueries = {
	me: () =>
		queryOptions({
			queryKey: tenantKeys.me(),
			queryFn: () => getCurrentTenant(),
			staleTime: 5 * 60 * 1000,
		}),
};

// -------------------------------------------------------
// Hooks
// -------------------------------------------------------

export function useCurrentTenant() {
	return useQuery(tenantQueries.me());
}

type UpdateTenantConfigOptions = Omit<
	UseMutationOptions<string, ProblemDetailsError, UpdateTenantConfigDto>,
	"mutationFn"
>;

type UpdateTenantBrandingOptions = Omit<
	UseMutationOptions<void, ProblemDetailsError, UpdateTenantBrandingDto>,
	"mutationFn"
>;

export function useUpdateTenantConfig(options?: UpdateTenantConfigOptions) {
	return useMutation<string, ProblemDetailsError, UpdateTenantConfigDto>({
		...options,
		mutationFn: (data) => updateTenantConfig({ data }),
		meta: {
			invalidates: tenantKeys.all(),
		},
	});
}

export function useUpdateTenantBranding(options?: UpdateTenantBrandingOptions) {
	return useMutation<void, ProblemDetailsError, UpdateTenantBrandingDto>({
		...options,
		mutationFn: (data) => updateTenantBranding({ data }),
		meta: {
			invalidates: tenantKeys.all(),
		},
	});
}
