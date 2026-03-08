import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createBundle, getBundles } from "./bundles.api";
import type {
  GetBundlesQueryDto,
  PaginatedDto,
  CreateBundleDto,
  BundleListItemResponseDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedBundles = PaginatedDto<BundleListItemResponseDto>;

type BundlesQueryOptions<TData = PaginatedBundles> = Omit<
  UseQueryOptions<PaginatedBundles, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type BundleMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateBundleDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createBundlesQueryOptions<TData = PaginatedBundles>(
  params: GetBundlesQueryDto = {} as GetBundlesQueryDto,
  options?: BundlesQueryOptions<TData>,
): UseQueryOptions<PaginatedBundles, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["bundles", params],
    queryFn: () => getBundles({ data: params }),
  };
}

// -----------------------------------------------------

export function useBundles<TData = PaginatedBundles>(
  params: GetBundlesQueryDto = {} as GetBundlesQueryDto,
  options?: BundlesQueryOptions<TData>,
) {
  return useQuery({
    ...createBundlesQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useCreateBundle(options?: BundleMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateBundleDto>({
    ...options,
    mutationFn: (data) => createBundle({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createBundlesQueryOptions().queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
