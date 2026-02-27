import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createProduct,
  getProductDetail,
  getProducts,
  type GetProductsParams,
} from "./products.api";
import type {
  CreateProductDto,
  PaginatedDto,
  ProductDetailDto,
  ProductListItemResponseDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedProducts = PaginatedDto<ProductListItemResponseDto>;

type ProductsQueryOptions<TData = PaginatedProducts> = Omit<
  UseQueryOptions<PaginatedProducts, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type ProductDetailQueryOptions<TData = ProductDetailDto> = Omit<
  UseQueryOptions<ProductDetailDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createProductsQueryOptions<TData = PaginatedProducts>(
  params: GetProductsParams = {},
  options?: ProductsQueryOptions<TData>,
): UseQueryOptions<PaginatedProducts, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["products", params],
    queryFn: () => getProducts({ data: params }),
  };
}

export function createProductDetailQueryOptions<TData = ProductDetailDto>(
  id: string,
  options?: ProductDetailQueryOptions<TData>,
): UseQueryOptions<ProductDetailDto, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["products", id],
    queryFn: () => getProductDetail({ data: { productId: id } }),
  };
}

// -----------------------------------------------------

export function useProducts<TData = PaginatedProducts>(
  params: GetProductsParams = {},
  options?: ProductsQueryOptions<TData>,
) {
  return useQuery({
    ...createProductsQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useProductDetail<TData = ProductDetailDto>(
  id: string,
  options?: ProductDetailQueryOptions<TData>,
) {
  return useQuery(createProductDetailQueryOptions(id, options));
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
