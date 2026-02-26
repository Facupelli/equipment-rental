import { apiFetch } from "@/lib/api";
import {
  createProductSchema,
  type CreateProductDto,
  type ProductResponseDto,
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

export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductResponseDto[]> => {
    const result = await apiFetch<ProductResponseDto[]>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
