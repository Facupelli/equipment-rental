import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getCoupons, createCoupon } from "./coupons.api";
import type {
  CouponView,
  ListCouponsQueryDto,
  CreateCouponDto,
  PaginatedDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type PaginatedCoupons = PaginatedDto<CouponView>;

export type CouponsQueryOverrides<TData = PaginatedCoupons> = Omit<
  UseQueryOptions<PaginatedCoupons, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -------------------------------------------------------
// Query Key Factory
// -------------------------------------------------------

export const couponKeys = {
  all: () => ["coupons"] as const,
  lists: () => [...couponKeys.all(), "list"] as const,
  list: (params: ListCouponsQueryDto) =>
    [...couponKeys.lists(), params] as const,
};

// -------------------------------------------------------
// Query Options
// -------------------------------------------------------

export const couponQueries = {
  list: <TData = PaginatedCoupons>(
    params: ListCouponsQueryDto,
    overrides?: CouponsQueryOverrides<TData>,
  ) =>
    queryOptions<PaginatedCoupons, ProblemDetailsError, TData>({
      queryKey: couponKeys.list(params),
      queryFn: () => getCoupons({ data: params }),
      ...overrides,
    }),
};

// -------------------------------------------------------
// Hooks
// -------------------------------------------------------

type CreateCouponOptions = Omit<
  UseMutationOptions<string, ProblemDetailsError, CreateCouponDto>,
  "mutationFn" | "mutationKey"
>;

export function useCoupons<TData = PaginatedCoupons>(
  params: ListCouponsQueryDto,
  overrides?: CouponsQueryOverrides<TData>,
) {
  return useQuery({
    ...couponQueries.list(params, overrides),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCoupon(options?: CreateCouponOptions) {
  return useMutation<string, ProblemDetailsError, CreateCouponDto>({
    ...options,
    mutationFn: (data) => createCoupon({ data }),
    meta: {
      invalidates: couponKeys.lists(),
    },
  });
}
