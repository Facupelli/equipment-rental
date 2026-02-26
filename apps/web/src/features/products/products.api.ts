import { apiFetch, type ApiResult } from "@/lib/api";
import { createProductSchema, type CreateProductDto } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: CreateProductDto) => createProductSchema.parse(data))
  .handler(async ({ data }): Promise<ApiResult<string>> => {
    const result = await apiFetch<string>("/products", {
      method: "POST",
      body: data,
    });

    return result;
  });
