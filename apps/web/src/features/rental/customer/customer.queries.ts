import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMeCustomer } from "./customer.api";

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const portalCustomerKeys = {
  all: () => ["user"] as const,
  me: () => [...portalCustomerKeys.all(), "me"] as const,
};

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useCurrentCustomer() {
  return useQuery(
    queryOptions({
      queryKey: portalCustomerKeys.me(),
      queryFn: () => getMeCustomer(),
      staleTime: 5 * 60 * 1000,
    }),
  );
}
