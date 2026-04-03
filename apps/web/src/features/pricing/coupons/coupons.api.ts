import {
  type CouponView,
  type CreateCouponDto,
  createCouponSchema,
  type ListCouponsQueryDto,
  listCouponsQuerySchema,
  type PaginatedDto,
  type ProblemDetails,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch, apiFetchPaginated } from "@/lib/api";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/pricing/coupons";

export const getCoupons = createServerFn({ method: "GET" })
  .inputValidator((data: ListCouponsQueryDto) =>
    listCouponsQuerySchema.parse(data),
  )
  .handler(async ({ data }): Promise<PaginatedDto<CouponView>> => {
    const result = await apiFetchPaginated<CouponView>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });

export const createCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: CreateCouponDto) => createCouponSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: { couponId: string }) => data)
  .handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
    try {
      await apiFetch<void>(`${apiUrl}/${data.couponId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        return { error: error.problemDetails };
      }

      throw error;
    }
  });
