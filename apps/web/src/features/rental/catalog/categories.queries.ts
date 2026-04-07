import type { ProductCategoryListResponse } from "@repo/schemas";
import {
  queryOptions,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";

import { ProblemDetailsError } from "@/shared/errors";

import { getRentalCategories } from "./categories.api";

export const rentalCategoryKeys = {
  all: () => ["rental-categories"] as const,
  lists: () => [...rentalCategoryKeys.all(), "list"] as const,
};

export const rentalCategoryQueries = {
  list: () =>
    queryOptions<ProductCategoryListResponse, ProblemDetailsError>({
      queryKey: rentalCategoryKeys.lists(),
      queryFn: () => getRentalCategories(),
    }),
};

type RentalCategoryQueryOptions<TData = ProductCategoryListResponse> = Omit<
  UseQueryOptions<ProductCategoryListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function useRentalCategories<TData = ProductCategoryListResponse>(
  options?: RentalCategoryQueryOptions<TData>,
) {
  const { queryKey, queryFn } = rentalCategoryQueries.list();

  return useQuery({
    ...options,
    queryKey,
    queryFn,
  });
}
