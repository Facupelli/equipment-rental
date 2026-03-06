import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  type PaginatedDto,
  type GetProductTypesQuery,
  type RentalProductResponse,
  getRentalProductQuerySchema,
  calculateCartPricesRequestSchema,
  type CalculateCartPricesRequest,
  type CartPriceResult,
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
