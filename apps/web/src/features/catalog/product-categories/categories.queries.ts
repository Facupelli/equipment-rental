import type {
  CreateProductCategoryDto,
  ProductCategoryListResponse,
  UpdateProductCategoryDto,
} from "@repo/schemas";
import {
  queryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "./categories.api";

// -----------------------------------------------------
// Query Key Factory
// -----------------------------------------------------

export const categoryKeys = {
  all: () => ["categories"] as const,
  lists: () => [...categoryKeys.all(), "list"] as const,
};

export const categoryQueries = {
  list: () =>
    queryOptions<ProductCategoryListResponse, ProblemDetailsError>({
      queryKey: categoryKeys.lists(),
      queryFn: () => getCategories(),
    }),
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

type UpdateCategoryMutationOptions = Omit<
  UseMutationOptions<
    void,
    ProblemDetailsError,
    { categoryId: string; dto: UpdateProductCategoryDto }
  >,
  "mutationFn"
>;

type DeleteCategoryMutationOptions = Omit<
  UseMutationOptions<void, ProblemDetailsError, { categoryId: string }>,
  "mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useCategories<TData = ProductCategoryListResponse>(
  options?: CategoryQueryOptions<TData>,
) {
  const { queryKey, queryFn } = categoryQueries.list();

  return useQuery({
    ...options,
    queryKey,
    queryFn,
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

export function useUpdateCategory(options?: UpdateCategoryMutationOptions) {
  return useMutation<
    void,
    ProblemDetailsError,
    { categoryId: string; dto: UpdateProductCategoryDto }
  >({
    ...options,
    mutationFn: ({ categoryId, dto }) =>
      updateCategory({ data: { categoryId, dto } }),
    meta: {
      invalidates: categoryKeys.lists(),
    },
  });
}

export function useDeleteCategory(options?: DeleteCategoryMutationOptions) {
  return useMutation<void, ProblemDetailsError, { categoryId: string }>({
    ...options,
    mutationFn: async ({ categoryId }) => {
      const result = await deleteCategory({ data: { categoryId } });
      if (typeof result === "object" && "error" in result) {
        throw new ProblemDetailsError(result.error);
      }
      return result;
    },
    meta: {
      invalidates: categoryKeys.lists(),
    },
  });
}
