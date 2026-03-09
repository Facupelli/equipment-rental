import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
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

type RentalProductsQueryOptions<TData = PaginatedRentalProducts> = Omit<
  UseSuspenseQueryOptions<PaginatedRentalProducts, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type NewArrivalsQueryOptions<TData = NewArrivalListResponseDto> = Omit<
  UseSuspenseQueryOptions<
    NewArrivalListResponseDto,
    ProblemDetailsError,
    TData
  >,
  "queryKey" | "queryFn"
>;

type RentalBundlesQueryOptions<TData = BundleListResponseDto> = Omit<
  UseSuspenseQueryOptions<BundleListResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type CartPricePreviewQueryOptions<TData = CartPriceResult> = Omit<
  UseQueryOptions<CartPriceResult, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createRentalProductsQueryOptions<
  TData = PaginatedRentalProducts,
>(
  params: GetRentalProductTypesQuery = {},
  options?: RentalProductsQueryOptions<TData>,
): UseSuspenseQueryOptions<
  PaginatedRentalProducts,
  ProblemDetailsError,
  TData
> {
  return {
    ...options,
    queryKey: ["rental-products", params],
    queryFn: () => getRentalProducts({ data: params }),
  };
}

export function createNewArrivalsQueryOptions<
  TData = NewArrivalListResponseDto,
>(
  params: GetNewArrivalsParams = {},
  options?: NewArrivalsQueryOptions<TData>,
): UseSuspenseQueryOptions<
  NewArrivalListResponseDto,
  ProblemDetailsError,
  TData
> {
  return {
    ...options,
    queryKey: ["rental-new-arrivals", params],
    queryFn: () => getNewArrivals({ data: params }),
  };
}

export function createRentalBundlesQueryOptions<TData = BundleListResponseDto>(
  params: GetCombosParams = {},
  options?: RentalBundlesQueryOptions<TData>,
): UseSuspenseQueryOptions<BundleListResponseDto, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["rental-bundles", params],
    queryFn: () => getRentalBundles({ data: params }),
  };
}

export function createCartPricePreviewQueryOptions<TData = CartPriceResult>(
  params: CalculateCartPricesRequest,
  options?: CartPricePreviewQueryOptions<TData>,
): UseQueryOptions<CartPriceResult, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["cart-price-preview", params],
    queryFn: () => getCartPricePreview({ data: params }),
  };
}

// -----------------------------------------------------

export function useRentalProducts<TData = PaginatedRentalProducts>(
  params: GetRentalProductTypesQuery = {},
  options?: RentalProductsQueryOptions<TData>,
) {
  return useQuery({
    ...createRentalProductsQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useNewArrivals<TData = NewArrivalListResponseDto>(
  params: GetNewArrivalsParams = {},
  options?: NewArrivalsQueryOptions<TData>,
) {
  return useQuery({
    ...createNewArrivalsQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useRentalBundles<TData = BundleListResponseDto>(
  params: GetCombosParams = {},
  options?: RentalBundlesQueryOptions<TData>,
) {
  return useQuery({
    ...createRentalBundlesQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useCartPricePreview<TData = CartPriceResult>(
  params: CalculateCartPricesRequest,
  options?: CartPricePreviewQueryOptions<TData>,
) {
  return useQuery({
    ...createCartPricePreviewQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}
