import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  createProductSchema,
  GetProductsQuerySchema,
  type CreateProductDto,
  type PaginatedDto,
  type ProductListItemResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/products";

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: CreateProductDto) => createProductSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export interface GetProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  trackingType?: string;
}

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((data: GetProductsParams) =>
    GetProductsQuerySchema.parse(data),
  )
  .handler(
    async ({ data }): Promise<PaginatedDto<ProductListItemResponseDto>> => {
      const result = await apiFetchPaginated<ProductListItemResponseDto>(
        apiUrl,
        {
          method: "GET",
          params: data,
        },
      );

      return result;
    },
  );
