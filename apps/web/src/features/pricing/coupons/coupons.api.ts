import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  type CouponView,
  type PaginatedDto,
  type ListCouponsQueryDto,
  type CreateCouponDto,
  createCouponSchema,
  listCouponsQuerySchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

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
