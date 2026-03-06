import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  CalculateCartPricesRequest,
  CartPriceResult,
  GetRentalProductTypesQuery,
  PaginatedDto,
  RentalProductResponse,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";
import { getCartPricePreview, getRentalProducts } from "./rental.api";

type PaginatedRentalProducts = PaginatedDto<RentalProductResponse>;

type RentalProductsQueryOptions<TData = PaginatedRentalProducts> = Omit<
  UseQueryOptions<PaginatedRentalProducts, ProblemDetailsError, TData>,
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
): UseQueryOptions<PaginatedRentalProducts, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["rental-products", params],
    queryFn: () => getRentalProducts({ data: params }),
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

export function useCartPricePreview<TData = CartPriceResult>(
  params: CalculateCartPricesRequest,
  options?: CartPricePreviewQueryOptions<TData>,
) {
  return useQuery({
    ...createCartPricePreviewQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}
