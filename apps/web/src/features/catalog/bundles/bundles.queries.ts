import {
  keepPreviousData,
  useMutation,
  useQuery,
  useSuspenseQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import {
  createBundle,
  getBundleDetail,
  getBundles,
  publishBundle,
  retireBundle,
} from "./bundles.api";
import type {
  GetBundlesQueryDto,
  PaginatedDto,
  CreateBundleDto,
  BundleListItemResponseDto,
  BundleDetailResponseDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedBundles = PaginatedDto<BundleListItemResponseDto>;

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const bundleKeys = {
  all: () => ["bundles"] as const,
  lists: () => [...bundleKeys.all(), "list"] as const,
  list: (params: GetBundlesQueryDto) =>
    [...bundleKeys.lists(), params] as const,
  details: () => [...bundleKeys.all(), "detail"] as const,
  detail: (id: string) => [...bundleKeys.details(), id] as const,
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type BundlesQueryOptions<TData = PaginatedBundles> = Omit<
  UseQueryOptions<PaginatedBundles, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type BundleDetailQueryOptions<TData = BundleDetailResponseDto> = Omit<
  UseSuspenseQueryOptions<BundleDetailResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type BundleMutationOptions = Omit<
  UseMutationOptions<string, ProblemDetailsError, CreateBundleDto>,
  "mutationFn"
>;

type BundleLifecycleMutationOptions = Omit<
  UseMutationOptions<void, ProblemDetailsError, { bundleId: string }>,
  "mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useBundles<TData = PaginatedBundles>(
  params: GetBundlesQueryDto = {} as GetBundlesQueryDto,
  options?: BundlesQueryOptions<TData>,
) {
  return useQuery({
    ...options,
    queryKey: bundleKeys.list(params),
    queryFn: () => getBundles({ data: params }),
    placeholderData: keepPreviousData,
  });
}

export function useBundleDetail<TData = BundleDetailResponseDto>(
  id: string,
  options?: BundleDetailQueryOptions<TData>,
) {
  return useSuspenseQuery({
    ...options,
    queryKey: bundleKeys.detail(id),
    queryFn: () => getBundleDetail({ data: { bundleId: id } }),
  });
}

export function useCreateBundle(options?: BundleMutationOptions) {
  return useMutation<string, ProblemDetailsError, CreateBundleDto>({
    ...options,
    mutationFn: (data) => createBundle({ data }),
    meta: {
      invalidates: bundleKeys.lists(),
    },
  });
}

export function usePublishBundle(options?: BundleLifecycleMutationOptions) {
  return useMutation<void, ProblemDetailsError, { bundleId: string }>({
    ...options,
    mutationFn: (data) => publishBundle({ data }),
    meta: {
      invalidates: bundleKeys.all(),
    },
  });
}

export function useRetireBundle(options?: BundleLifecycleMutationOptions) {
  return useMutation<void, ProblemDetailsError, { bundleId: string }>({
    ...options,
    mutationFn: (data) => retireBundle({ data }),
    meta: {
      invalidates: bundleKeys.all(),
    },
  });
}
