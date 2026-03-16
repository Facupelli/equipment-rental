import {
  keepPreviousData,
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  BundleListResponseDto,
  CalculateCartPricesRequest,
  CartPriceResult,
  GetCombosParams,
  GetNewArrivalsParams,
  GetRentalProductTypesQuery,
  NewArrivalListResponseDto,
  PaginatedDto,
  RentalProductResponse,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";
import {
  getCartPricePreview,
  getNewArrivals,
  getRentalBundles,
  getRentalProducts,
} from "./rental.api";

type PaginatedRentalProducts = PaginatedDto<RentalProductResponse>;

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const rentalKeys = {
  all: () => ["rental"] as const,
  products: () => [...rentalKeys.all(), "products"] as const,
  product: (params: GetRentalProductTypesQuery) =>
    [...rentalKeys.products(), params] as const,
  newArrivals: () => [...rentalKeys.all(), "new-arrivals"] as const,
  newArrival: (params: GetNewArrivalsParams) =>
    [...rentalKeys.newArrivals(), params] as const,
  bundles: () => [...rentalKeys.all(), "bundles"] as const,
  bundle: (params: GetCombosParams) =>
    [...rentalKeys.bundles(), params] as const,
  cartPreviews: () => [...rentalKeys.all(), "cart-preview"] as const,
  cartPreview: (params: CalculateCartPricesRequest) =>
    [...rentalKeys.cartPreviews(), params] as const,
};

export const rentalQueries = {
  products: (params: GetRentalProductTypesQuery = {}) =>
    queryOptions<PaginatedRentalProducts, ProblemDetailsError>({
      queryKey: rentalKeys.product(params),
      queryFn: () => getRentalProducts({ data: params }),
    }),
  newArrivals: (params: GetNewArrivalsParams = {}) =>
    queryOptions<NewArrivalListResponseDto, ProblemDetailsError>({
      queryKey: rentalKeys.newArrival(params),
      queryFn: () => getNewArrivals({ data: params }),
    }),
  bundles: (params: GetCombosParams = {}) =>
    queryOptions<BundleListResponseDto, ProblemDetailsError>({
      queryKey: rentalKeys.bundle(params),
      queryFn: () => getRentalBundles({ data: params }),
    }),
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type RentalProductsQueryOptions<TData = PaginatedRentalProducts> = Omit<
  UseQueryOptions<PaginatedRentalProducts, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type NewArrivalsQueryOptions<TData = NewArrivalListResponseDto> = Omit<
  UseQueryOptions<NewArrivalListResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type RentalBundlesQueryOptions<TData = BundleListResponseDto> = Omit<
  UseQueryOptions<BundleListResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type CartPricePreviewQueryOptions<TData = CartPriceResult> = Omit<
  UseQueryOptions<CartPriceResult, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useRentalProducts<TData = PaginatedRentalProducts>(
  params: GetRentalProductTypesQuery = {},
  options?: RentalProductsQueryOptions<TData>,
) {
  const { queryKey, queryFn } = rentalQueries.products(params);

  return useQuery({
    ...options,
    queryKey,
    queryFn,
    placeholderData: keepPreviousData,
  });
}

export function useNewArrivals<TData = NewArrivalListResponseDto>(
  params: GetNewArrivalsParams = {},
  options?: NewArrivalsQueryOptions<TData>,
) {
  const { queryKey, queryFn } = rentalQueries.newArrivals(params);

  return useQuery({
    ...options,
    queryKey,
    queryFn,
    placeholderData: keepPreviousData,
  });
}

export function useRentalBundles<TData = BundleListResponseDto>(
  params: GetCombosParams = {},
  options?: RentalBundlesQueryOptions<TData>,
) {
  const { queryKey, queryFn } = rentalQueries.bundles(params);

  return useQuery({
    ...options,
    queryKey,
    queryFn,
    placeholderData: keepPreviousData,
  });
}

export function useCartPricePreview<TData = CartPriceResult>(
  params: CalculateCartPricesRequest,
  options?: CartPricePreviewQueryOptions<TData>,
) {
  return useQuery({
    ...options,
    queryKey: rentalKeys.cartPreview(params),
    queryFn: () => getCartPricePreview({ data: params }),
    placeholderData: keepPreviousData,
  });
}
