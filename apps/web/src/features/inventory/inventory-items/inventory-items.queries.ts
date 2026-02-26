import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createInventoryItem, getInventoryItems } from "./inventory-items.api";
import type {
  CreateInventoryItemDto,
  InventoryItemResponseDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type InventoryItemsOptions<TData = InventoryItemResponseDto[]> = Omit<
  UseQueryOptions<InventoryItemResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function createInventoryItemsQueryOptions<
  TData = InventoryItemResponseDto[],
>(
  options?: InventoryItemsOptions<TData>,
): UseQueryOptions<InventoryItemResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["inventory-items"],
    queryFn: () => getInventoryItems(),
  };
}

//

export function useInventoryItems() {
  return useQuery(createInventoryItemsQueryOptions());
}

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
