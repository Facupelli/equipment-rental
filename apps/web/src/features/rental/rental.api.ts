import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  type PaginatedDto,
  type GetProductTypesQuery,
  type RentalProductResponse,
  getRentalProductQuerySchema,
  calculateCartPricesRequestSchema,
  type CalculateCartPricesRequest,
  type CartPriceResult,
  type GetNewArrivalsParams,
  type NewArrivalListResponseDto,
  type GetCombosParams,
  type BundleListResponseDto,
  getNewArrivalsParamsSchema,
  getBundleParamsSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/rental";

export interface GetProductDetailParams {
  productId: string;
}

export const getRentalProducts = createServerFn({ method: "GET" })
  .inputValidator((data: GetProductTypesQuery) =>
    getRentalProductQuerySchema.parse(data),
  )
  .handler(async ({ data }): Promise<PaginatedDto<RentalProductResponse>> => {
    const result = await apiFetchPaginated<RentalProductResponse>(
      `${apiUrl}/product-types`,
      {
        method: "GET",
        params: data,
      },
    );

    return result;
  });

export const getNewArrivals = createServerFn({ method: "GET" })
  .inputValidator((data: GetNewArrivalsParams) =>
    getNewArrivalsParamsSchema.parse(data),
  )
  .handler(async ({ data }): Promise<NewArrivalListResponseDto> => {
    return await apiFetch<NewArrivalListResponseDto>(`${apiUrl}/new-arrivals`, {
      method: "GET",
      params: data,
    });
  });

export const getRentalBundles = createServerFn({ method: "GET" })
  .inputValidator((data: GetCombosParams) => getBundleParamsSchema.parse(data))
  .handler(async ({ data }): Promise<BundleListResponseDto> => {
    return await apiFetch<BundleListResponseDto>(`${apiUrl}/bundles`, {
      method: "GET",
      params: data,
    });
  });

export const getCartPricePreview = createServerFn({ method: "POST" })
  .inputValidator((data: CalculateCartPricesRequest) =>
    calculateCartPricesRequestSchema.parse(data),
  )
  .handler(async ({ data }): Promise<CartPriceResult> => {
    const result = await apiFetch<CartPriceResult>("/pricing/cart/preview", {
      method: "POST",
      body: data,
    });

    return result;
  });
