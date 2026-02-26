import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createProduct } from "./products.api";
import type { ApiResult } from "@/lib/api";
import type { CreateProductDto } from "@repo/schemas";

export function useCreateProduct(): UseMutationResult<
  ApiResult<string>,
  Error,
  { data: CreateProductDto }
> {
  const createProductFn = useServerFn(createProduct);

  return useMutation({
    mutationFn: createProductFn,
    onSuccess: async (result) => {
      if (result.success) {
        // invalidate products
        // await queryClient.invalidateQueries({
        // queryKey: authQueryKey.currentUser,
        // });

        console.log({ result });
      }
    },
  });
}
