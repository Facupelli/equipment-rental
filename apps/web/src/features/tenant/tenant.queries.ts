import {
  queryOptions,
  useQuery,
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getCurrentTenant, updateTenantConfig } from "./tenant.api";
import type { UpdateTenantConfigDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

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

export function useUpdateTenantConfig(options?: UpdateTenantConfigOptions) {
  return useMutation<string, ProblemDetailsError, UpdateTenantConfigDto>({
    ...options,
    mutationFn: (data) => updateTenantConfig({ data }),
    meta: {
      invalidates: tenantKeys.all(),
    },
  });
}
