import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createInventoryItem,
  getInventoryItems,
  type GetInventoryItemsParams,
} from "./assets.api";
import type { AssetCreate, AssetResponse, PaginatedDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedInventoryItems = PaginatedDto<AssetResponse>;

type InventoryItemsOptions<TData = PaginatedInventoryItems> = Omit<
  UseQueryOptions<PaginatedInventoryItems, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createAssetQueryOptions<TData = PaginatedInventoryItems>(
  params: GetInventoryItemsParams = {},
  options?: InventoryItemsOptions<TData>,
): UseQueryOptions<PaginatedInventoryItems, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["inventory-items", params],
    queryFn: () => getInventoryItems({ data: params }),
  };
}

//

export function useAssets<TData = PaginatedInventoryItems>(
  params: GetInventoryItemsParams = {},
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
    mutationFn: (data) => createInventoryItem({ data }),
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
