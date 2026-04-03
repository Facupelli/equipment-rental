import type {
  CouponView,
  CreateCouponDto,
  ListCouponsQueryDto,
  PaginatedDto,
} from "@repo/schemas";
import {
  keepPreviousData,
  queryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import { createCoupon, deleteCoupon, getCoupons } from "./coupons.api";

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

type DeleteCouponOptions = Omit<
  UseMutationOptions<void, ProblemDetailsError, { couponId: string }>,
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

export function useDeleteCoupon(options?: DeleteCouponOptions) {
  return useMutation<void, ProblemDetailsError, { couponId: string }>({
    ...options,
    mutationFn: async ({ couponId }) => {
      const result = await deleteCoupon({ data: { couponId } });

      if (typeof result === "object" && result !== null && "error" in result) {
        throw new ProblemDetailsError(result.error);
      }
    },
    meta: {
      invalidates: couponKeys.lists(),
    },
  });
}
