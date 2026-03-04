import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createOwner, getOwners } from "./owners.api";
import type { ProblemDetailsError } from "@/shared/errors";
import type { OwnerCreate, OwnerListResponse } from "@repo/schemas";

type OwnerQueryOptions<TData = OwnerListResponse> = Omit<
  UseQueryOptions<OwnerListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type OwnerMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, OwnerCreate>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createOwnerQueryOptions<TData = OwnerListResponse>(
  options?: OwnerQueryOptions<TData>,
): UseQueryOptions<OwnerListResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["owners"],
    queryFn: () => getOwners(),
  };
}

// -----------------------------------------------------

export function useOwners<TData = OwnerListResponse>(
  options?: OwnerQueryOptions<TData>,
) {
  return useQuery(createOwnerQueryOptions(options));
}

//

export function useCreateOwner(options?: OwnerMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, OwnerCreate>({
    ...options,
    mutationFn: (data) => createOwner({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createOwnerQueryOptions().queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
