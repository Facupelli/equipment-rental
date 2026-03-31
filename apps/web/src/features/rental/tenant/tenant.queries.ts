import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getTenantPricingConfig } from "./tenant.api";

// -------------------------------------------------------
// Key Factory
// -------------------------------------------------------

export const rentalTenantKeys = {
  all: () => ["tenant-pricing-config"] as const,
  me: () => [...rentalTenantKeys.all(), "me"] as const,
};

export const rentalTenantQueries = {
  me: () =>
    queryOptions({
      queryKey: rentalTenantKeys.me(),
      queryFn: () => getTenantPricingConfig(),
      staleTime: 5 * 60 * 1000,
    }),
};

// -------------------------------------------------------
// Hooks
// -------------------------------------------------------

export function useTenantPricingConfig() {
  return useSuspenseQuery(rentalTenantQueries.me());
}
