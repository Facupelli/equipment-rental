import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createAsset, getAssets, type GetAssetsParams } from "./assets.api";
import type { AssetCreate, AssetResponse, PaginatedDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedAssets = PaginatedDto<AssetResponse>;

type InventoryItemsOptions<TData = PaginatedAssets> = Omit<
  UseQueryOptions<PaginatedAssets, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createAssetQueryOptions<TData = PaginatedAssets>(
  params: GetAssetsParams = {},
  options?: InventoryItemsOptions<TData>,
): UseQueryOptions<PaginatedAssets, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["assets", params],
    queryFn: () => getAssets({ data: params }),
  };
}

//

export function useAssets<TData = PaginatedAssets>(
  params: GetAssetsParams = {},
  options?: InventoryItemsOptions<TData>,
) {
  return useQuery({
    ...createAssetQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

//

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, AssetCreate>({
    mutationFn: (data) => createAsset({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createAssetQueryOptions().queryKey,
      });
    },
    onError: (error) => {
      // error is fully typed as ProblemDetailsError here.
      // You can log, toast, or handle it however you like.
      console.error(
        `[${error.problemDetails.status}] ${error.problemDetails.detail}`,
      );
    },
  });
}
