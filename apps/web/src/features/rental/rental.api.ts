import {
  type BundleListResponseDto,
  type CalculateCartPricesRequest,
  type CartPriceResult,
  calculateCartPricesRequestSchema,
  type GetCombosParams,
  type GetNewArrivalsParams,
  type GetRentalProductTypesQuery,
  getBundleParamsSchema,
  getNewArrivalsParamsSchema,
  getRentalProductQuerySchema,
  type NewArrivalListResponseDto,
  type PaginatedDto,
  type RentalProductResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import {
  storefrontApiFetch,
  storefrontApiFetchPaginated,
} from "@/lib/storefront-api";

const apiUrl = "/rental";

export interface GetProductDetailParams {
  productId: string;
}

export const getRentalProducts = createServerFn({ method: "GET" })
  .inputValidator((data: GetRentalProductTypesQuery) =>
    getRentalProductQuerySchema.parse(data),
  )
  .handler(async ({ data }): Promise<PaginatedDto<RentalProductResponse>> => {
    const result = await storefrontApiFetchPaginated<RentalProductResponse>(
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
    return await storefrontApiFetch<NewArrivalListResponseDto>(
      `${apiUrl}/new-arrivals`,
      {
        method: "GET",
        params: data,
      },
    );
  });

export const getRentalBundles = createServerFn({ method: "GET" })
  .inputValidator((data: GetCombosParams) => getBundleParamsSchema.parse(data))
  .handler(async ({ data }): Promise<BundleListResponseDto> => {
    return await storefrontApiFetch<BundleListResponseDto>(
      `${apiUrl}/bundles`,
      {
        method: "GET",
        params: data,
      },
    );
  });

export const getCartPricePreview = createServerFn({ method: "POST" })
  .inputValidator((data: CalculateCartPricesRequest) =>
    calculateCartPricesRequestSchema.parse(data),
  )
  .handler(async ({ data }): Promise<CartPriceResult> => {
    const result = await storefrontApiFetch<CartPriceResult>(
      "/pricing/cart/preview",
      {
        method: "POST",
        body: data,
      },
    );

    return result;
  });
