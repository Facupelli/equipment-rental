import { apiFetch } from "@/lib/api";
import {
  createProductCategorySchema,
  type CreateProductCategoryDto,
  type ProductCategoryListResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/product-categories";

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((data: CreateProductCategoryDto) =>
    createProductCategorySchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductCategoryListResponse> => {
    const result = await apiFetch<ProductCategoryListResponse>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
