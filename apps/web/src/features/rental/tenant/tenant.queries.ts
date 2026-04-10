import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { usePortalTenantId } from "@/features/tenant-context/use-portal-tenant-id";
import { getTenantPricingConfig } from "./tenant.api";

// -------------------------------------------------------
// Key Factory
// -------------------------------------------------------

export const rentalTenantKeys = {
	all: (tenantId: string) => ["tenant-pricing-config", tenantId] as const,
	me: (tenantId: string) => [...rentalTenantKeys.all(tenantId), "me"] as const,
};

export const rentalTenantQueries = {
	me: (tenantId: string) =>
		queryOptions({
			queryKey: rentalTenantKeys.me(tenantId),
			queryFn: () => getTenantPricingConfig(),
			staleTime: 5 * 60 * 1000,
		}),
};

// -------------------------------------------------------
// Hooks
// -------------------------------------------------------

export function useTenantPricingConfig() {
	const tenantId = usePortalTenantId();

	return useSuspenseQuery(rentalTenantQueries.me(tenantId));
}
