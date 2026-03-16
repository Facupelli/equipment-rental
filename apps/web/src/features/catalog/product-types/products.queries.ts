import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useSuspenseQuery,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { getProductDetail, getProducts } from "./products.api";
import type {
  GetProductTypesQuery,
  PaginatedDto,
  ProductTypeResponse,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedProducts = PaginatedDto<ProductTypeResponse>;

// -------------------------------------------------------
// Type helpers for the "Menace" pattern (optional overrides)
// -------------------------------------------------------

export type ProductsQueryOverrides<TData = PaginatedProducts> = Omit<
  UseQueryOptions<PaginatedProducts, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export type ProductDetailQueryOverrides<TData = ProductTypeResponse> = Omit<
  UseSuspenseQueryOptions<ProductTypeResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -------------------------------------------------------
// Query Key Factory
// -------------------------------------------------------

export const productKeys = {
  all: () => ["products"] as const,
  lists: () => [...productKeys.all(), "list"] as const,
  list: (params: GetProductTypesQuery) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all(), "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// -------------------------------------------------------
// Query Options
// -------------------------------------------------------

export const productQueries = {
  list: <TData = PaginatedProducts>(
    params: GetProductTypesQuery = {},
    overrides?: ProductsQueryOverrides<TData>,
  ) =>
    queryOptions<PaginatedProducts, ProblemDetailsError, TData>({
      queryKey: productKeys.list(params),
      queryFn: () => getProducts({ data: params }),
      ...overrides,
    }),

  detail: <TData = ProductTypeResponse>(
    id: string,
    overrides?: ProductDetailQueryOverrides<TData>,
  ) =>
    queryOptions<ProductTypeResponse, ProblemDetailsError, TData>({
      queryKey: productKeys.detail(id),
      queryFn: () => getProductDetail({ data: { productId: id } }),
      ...overrides,
    }),
};

// -------------------------------------------------------
// Hooks
// -------------------------------------------------------

export function useProducts<TData = PaginatedProducts>(
  params: GetProductTypesQuery = {},
  overrides?: ProductsQueryOverrides<TData>,
) {
  return useQuery({
    ...productQueries.list(params, overrides),
    placeholderData: keepPreviousData,
  });
}

export function useProductDetail<TData = ProductTypeResponse>(
  id: string,
  overrides?: ProductDetailQueryOverrides<TData>,
) {
  return useSuspenseQuery(productQueries.detail(id, overrides));
}
