import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createOwner, getOwners } from "./owners.api";
import type { CreateOwnerDto, OwnerResponseDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type OwnerQueryOptions<TData = OwnerResponseDto[]> = Omit<
  UseQueryOptions<OwnerResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type OwnerMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateOwnerDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createOwnerQueryOptions<TData = OwnerResponseDto[]>(
  options?: OwnerQueryOptions<TData>,
): UseQueryOptions<OwnerResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["owners"],
    queryFn: () => getOwners(),
  };
}

// -----------------------------------------------------

export function useOwners<TData = OwnerResponseDto[]>(
  options?: OwnerQueryOptions<TData>,
) {
  return useQuery(createOwnerQueryOptions(options));
}

//

export function useCreateOwner(options?: OwnerMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateOwnerDto>({
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
