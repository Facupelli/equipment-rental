import { apiFetchPaginated } from "@/lib/api";
import {
  type PaginatedDto,
  type GetProductTypesQuery,
  type RentalProductResponse,
  getRentalProductQuerySchema,
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
