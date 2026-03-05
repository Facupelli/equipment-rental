import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createAsset, getAssets } from "./assets.api";
import type {
  AssetResponse,
  CreateAssetDto,
  GetAssetsQuery,
  PaginatedDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedAssets = PaginatedDto<AssetResponse>;

type AssetsOptions<TData = PaginatedAssets> = Omit<
  UseQueryOptions<PaginatedAssets, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type AssetMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateAssetDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createAssetQueryOptions<TData = PaginatedAssets>(
  params: GetAssetsQuery = {},
  options?: AssetsOptions<TData>,
): UseQueryOptions<PaginatedAssets, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["assets", params],
    queryFn: () => getAssets({ data: params }),
  };
}

//

export function useAssets<TData = PaginatedAssets>(
  params: GetAssetsQuery = {},
  options?: AssetsOptions<TData>,
) {
  return useQuery({
    ...createAssetQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

//

export function useCreateAsset(options?: AssetMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateAssetDto>({
    ...options,
    mutationFn: (data) => createAsset({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createAssetQueryOptions().queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
