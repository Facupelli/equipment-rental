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
} from "./inventory-items.api";
import type {
  CreateInventoryItemDto,
  InventoryItemListItemDto,
  PaginatedDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedInventoryItems = PaginatedDto<InventoryItemListItemDto>;

type InventoryItemsOptions<TData = PaginatedInventoryItems> = Omit<
  UseQueryOptions<PaginatedInventoryItems, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createInventoryItemsQueryOptions<
  TData = PaginatedInventoryItems,
>(
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

export function useInventoryItems<TData = PaginatedInventoryItems>(
  params: GetInventoryItemsParams = {},
  options?: InventoryItemsOptions<TData>,
) {
  return useQuery({
    ...createInventoryItemsQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

//

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateInventoryItemDto>({
    mutationFn: (data) => createInventoryItem({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createInventoryItemsQueryOptions().queryKey,
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
