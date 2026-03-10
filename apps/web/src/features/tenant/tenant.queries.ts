import type { ProblemDetailsError } from "@/shared/errors";
import type { UpdateTenantConfigDto } from "@repo/schemas";
import {
  useMutation,
  useQueryClient,
  type MutationOptions,
} from "@tanstack/react-query";
import { updateTenantConfig } from "./tenant.api";

type TenantMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, UpdateTenantConfigDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function useUpdateConfig(options?: TenantMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, UpdateTenantConfigDto>({
    ...options,
    mutationFn: (data) => updateTenantConfig({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      // await queryClient.invalidateQueries({
      //   queryKey: createProductsQueryOptions().queryKey,
      // });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
