import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createAsset, getAssets } from "./assets.api";
import type {
  AssetResponseDto,
  CreateAssetDto,
  GetAssetsQuery,
  PaginatedDto,
} from "@repo/schemas";
import { ProblemDetailsError } from "@/shared/errors";

type PaginatedAssets = PaginatedDto<AssetResponseDto>;

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const assetKeys = {
  all: () => ["assets"] as const,
  lists: () => [...assetKeys.all(), "list"] as const,
  list: (params: GetAssetsQuery) => [...assetKeys.lists(), params] as const,
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type AssetsOptions<TData = PaginatedAssets> = Omit<
  UseQueryOptions<PaginatedAssets, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type AssetMutationOptions = Omit<
  UseMutationOptions<string, ProblemDetailsError, CreateAssetDto>,
  "mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useAssets<TData = PaginatedAssets>(
  params: GetAssetsQuery = {},
  options?: AssetsOptions<TData>,
) {
  return useQuery({
    ...options,
    queryKey: assetKeys.list(params),
    queryFn: () => getAssets({ data: params }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAsset(options?: AssetMutationOptions) {
  return useMutation<string, ProblemDetailsError, CreateAssetDto>({
    ...options,
    mutationFn: async (data) => {
      const result = await createAsset({ data });
      if (typeof result === "object" && "error" in result) {
        throw new ProblemDetailsError(result.error);
      }
      return result;
    },
    meta: {
      invalidates: assetKeys.lists(),
    },
  });
}
