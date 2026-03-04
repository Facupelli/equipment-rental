import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  ProductTypeCreateSchema,
  GetProductTypesQuerySchema,
  type ProductTypeCreate,
  type ProductTypeResponse,
  type PaginatedDto,
  type GetProductTypesQuery,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const apiUrl = "/product-types";

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductTypeCreate) =>
    ProductTypeCreateSchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export interface GetProductDetailParams {
  productId: string;
}

const productDetailParamsSchema = z.object({
  productId: z.uuid(),
});

export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((data: GetProductDetailParams) =>
    productDetailParamsSchema.parse(data),
  )
  .handler(async ({ data }): Promise<ProductTypeResponse> => {
    const result = await apiFetch<ProductTypeResponse>(
      `${apiUrl}/${data.productId}`,
      {
        method: "GET",
      },
    );

    return result;
  });

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((data: GetProductTypesQuery) =>
    GetProductTypesQuerySchema.parse(data),
  )
  .handler(async ({ data }): Promise<PaginatedDto<ProductTypeResponse>> => {
    const result = await apiFetchPaginated<ProductTypeResponse>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });
