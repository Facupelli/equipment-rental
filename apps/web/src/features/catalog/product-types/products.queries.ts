import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createProduct, getProductDetail, getProducts } from "./products.api";
import type {
  GetProductTypesQuery,
  PaginatedDto,
  CreateProductTypeDto,
  ProductTypeResponse,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedProducts = PaginatedDto<ProductTypeResponse>;

type ProductsQueryOptions<TData = PaginatedProducts> = Omit<
  UseQueryOptions<PaginatedProducts, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type ProductDetailQueryOptions<TData = ProductTypeResponse> = Omit<
  UseQueryOptions<ProductTypeResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type ProductMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateProductTypeDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createProductsQueryOptions<TData = PaginatedProducts>(
  params: GetProductTypesQuery = {},
  options?: ProductsQueryOptions<TData>,
): UseQueryOptions<PaginatedProducts, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["products", params],
    queryFn: () => getProducts({ data: params }),
  };
}

export function createProductDetailQueryOptions<TData = ProductTypeResponse>(
  id: string,
  options?: ProductDetailQueryOptions<TData>,
): UseQueryOptions<ProductTypeResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["products", id],
    queryFn: () => getProductDetail({ data: { productId: id } }),
  };
}

// -----------------------------------------------------

export function useProducts<TData = PaginatedProducts>(
  params: GetProductTypesQuery = {},
  options?: ProductsQueryOptions<TData>,
) {
  return useQuery({
    ...createProductsQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useProductDetail<TData = ProductTypeResponse>(
  id: string,
  options?: ProductDetailQueryOptions<TData>,
) {
  return useQuery(createProductDetailQueryOptions(id, options));
}

export function useCreateProduct(options?: ProductMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateProductTypeDto>({
    ...options,
    mutationFn: (data) => createProduct({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createProductsQueryOptions().queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
