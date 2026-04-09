import type { ProductCategoryListResponse } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

import { storefrontApiFetch } from "@/lib/storefront-api";

const apiUrl = "/rental/categories";

export const getRentalCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductCategoryListResponse> => {
    const result = await storefrontApiFetch<ProductCategoryListResponse>(
      apiUrl,
      {
        method: "GET",
      },
    );

    return result;
  },
);
