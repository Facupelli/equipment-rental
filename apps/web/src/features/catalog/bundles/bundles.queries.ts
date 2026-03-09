import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { createBundle, getBundleDetail, getBundles } from "./bundles.api";
import type {
  GetBundlesQueryDto,
  PaginatedDto,
  CreateBundleDto,
  BundleListItemResponseDto,
  BundleDetailResponseDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedBundles = PaginatedDto<BundleListItemResponseDto>;

type BundlesQueryOptions<TData = PaginatedBundles> = Omit<
  UseQueryOptions<PaginatedBundles, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type BundleDetailQueryOptions<TData = BundleDetailResponseDto> = Omit<
  UseSuspenseQueryOptions<BundleDetailResponseDto, ProblemDetailsError, TData>,
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

export function createBundleDetailQueryOptions<TData = BundleDetailResponseDto>(
  id: string,
  options?: BundleDetailQueryOptions<TData>,
): UseSuspenseQueryOptions<
  BundleDetailResponseDto,
  ProblemDetailsError,
  TData
> {
  return {
    ...options,
    queryKey: ["bundle", id],
    queryFn: () => getBundleDetail({ data: { bundleId: id } }),
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

export function useBundleDetail<TData = BundleDetailResponseDto>(
  id: string,
  options?: BundleDetailQueryOptions<TData>,
) {
  return useQuery(createBundleDetailQueryOptions(id, options));
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
