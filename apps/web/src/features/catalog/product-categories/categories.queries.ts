import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createCategory, getCategories } from "./categories.api";
import type { ProblemDetailsError } from "@/shared/errors";
import type {
  ProductCategoryCreate,
  ProductCategoryListResponse,
} from "@repo/schemas";

type CategoryQueryOptions<TData = ProductCategoryListResponse> = Omit<
  UseQueryOptions<ProductCategoryListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type CategoryMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, ProductCategoryCreate>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createCategoryQueryOptions<TData = ProductCategoryListResponse>(
  options?: CategoryQueryOptions<TData>,
): UseQueryOptions<ProductCategoryListResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  };
}

// -----------------------------------------------------

export function useCategories<TData = ProductCategoryListResponse>(
  options?: CategoryQueryOptions<TData>,
) {
  return useQuery(createCategoryQueryOptions(options));
}

//

export function useCreateCategory(options?: CategoryMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, ProductCategoryCreate>({
    ...options,
    mutationFn: (data) => createCategory({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createCategoryQueryOptions().queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
