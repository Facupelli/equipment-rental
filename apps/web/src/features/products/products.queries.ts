import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createProduct, getProducts } from "./products.api";
import type { CreateProductDto, ProductResponseDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type ProductsQueryOptions<TData = ProductResponseDto[]> = Omit<
  UseQueryOptions<ProductResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function createProductsQueryOptions<TData = ProductResponseDto[]>(
  options?: ProductsQueryOptions<TData>,
): UseQueryOptions<ProductResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["products"],
    queryFn: () => getProducts(),
  };
}

//

export function useProducts() {
  return useQuery(createProductsQueryOptions());
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateProductDto>({
    mutationFn: (data) => createProduct({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createProductsQueryOptions().queryKey,
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
