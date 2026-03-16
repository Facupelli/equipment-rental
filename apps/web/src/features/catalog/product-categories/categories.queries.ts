import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createCategory, getCategories } from "./categories.api";
import type { ProblemDetailsError } from "@/shared/errors";
import type {
  CreateProductCategoryDto,
  ProductCategoryListResponse,
} from "@repo/schemas";

// -----------------------------------------------------
// Query Key Factory
// -----------------------------------------------------

export const categoryKeys = {
  all: () => ["categories"] as const,
  lists: () => [...categoryKeys.all(), "list"] as const,
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type CategoryQueryOptions<TData = ProductCategoryListResponse> = Omit<
  UseQueryOptions<ProductCategoryListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type CategoryMutationOptions = Omit<
  UseMutationOptions<string, ProblemDetailsError, CreateProductCategoryDto>,
  "mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useCategories<TData = ProductCategoryListResponse>(
  options?: CategoryQueryOptions<TData>,
) {
  return useQuery({
    ...options,
    queryKey: categoryKeys.lists(),
    queryFn: () => getCategories(),
  });
}

export function useCreateCategory(options?: CategoryMutationOptions) {
  return useMutation<string, ProblemDetailsError, CreateProductCategoryDto>({
    ...options,
    mutationFn: (data) => createCategory({ data }),
    meta: {
      invalidates: categoryKeys.lists(),
    },
  });
}
