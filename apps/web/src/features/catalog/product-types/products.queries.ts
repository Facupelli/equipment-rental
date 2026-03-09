import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import {
  createProduct,
  getProductDetail,
  getProducts,
  publishProductType,
  retireProductType,
} from "./products.api";
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
  UseSuspenseQueryOptions<ProductTypeResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
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
): UseSuspenseQueryOptions<ProductTypeResponse, ProblemDetailsError, TData> {
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

// MUTATIONS

type ProductTypeLifecycleMutationOptions = Omit<
  MutationOptions<void, ProblemDetailsError, { productTypeId: string }>,
  "mutationFn" | "mutationKey"
>;

type ProductMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateProductTypeDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

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

export function usePublishProductType(
  options?: ProductTypeLifecycleMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<void, ProblemDetailsError, { productTypeId: string }>({
    ...options,
    mutationFn: (data) => publishProductType({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createProductDetailQueryOptions(variables.productTypeId)
          .queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}

export function useRetireProductType(
  options?: ProductTypeLifecycleMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<void, ProblemDetailsError, { productTypeId: string }>({
    ...options,
    mutationFn: (data) => retireProductType({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createProductDetailQueryOptions(variables.productTypeId)
          .queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
