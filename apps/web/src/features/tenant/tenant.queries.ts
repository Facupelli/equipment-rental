import { queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import { getCurrentTenant, updateTenantConfig } from "./tenant.api";
import type { UpdateTenantConfigDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";
import type { MutationOptions } from "@tanstack/react-query";

// -------------------------------------------------------
// Query Key Factory
// -------------------------------------------------------

export const tenantKeys = {
  all: () => ["tenant"] as const,
  me: () => [...tenantKeys.all(), "me"] as const,
};

// -------------------------------------------------------
// Query Options
// -------------------------------------------------------

export const tenantQueries = {
  me: () =>
    queryOptions({
      queryKey: tenantKeys.me(),
      queryFn: () => getCurrentTenant(),
      staleTime: 5 * 60 * 1000,
    }),
};

// -------------------------------------------------------
// Query Hook
// -------------------------------------------------------

export function useCurrentTenant() {
  return useQuery(tenantQueries.me());
}

// -------------------------------------------------------
// Mutation Hook
// -------------------------------------------------------

type UpdateTenantConfigOptions = Omit<
  MutationOptions<string, ProblemDetailsError, UpdateTenantConfigDto>,
  "mutationFn" | "mutationKey"
>;

export function useUpdateTenantConfig(options?: UpdateTenantConfigOptions) {
  return useMutation<string, ProblemDetailsError, UpdateTenantConfigDto>({
    ...options,
    mutationFn: (data) => updateTenantConfig({ data }),
    meta: {
      // Invalidates all tenant queries — cascades to "me" automatically
      invalidates: tenantKeys.all(),
    },
  });
}
