import { apiFetch } from "@/lib/api";
import {
  createCategorySchema,
  type CategoryResponseDto,
  type CreateCategorySchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/categories";

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((data: CreateCategorySchema) =>
    createCategorySchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryResponseDto[]> => {
    const result = await apiFetch<CategoryResponseDto[]>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
