import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createCategory, getCategories } from "./categories.api";
import type { CategoryResponseDto, CreateCategorySchema } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type CategoryQueryOptions<TData = CategoryResponseDto[]> = Omit<
  UseQueryOptions<CategoryResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type CategoryMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateCategorySchema>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createCategoryQueryOptions<TData = CategoryResponseDto[]>(
  options?: CategoryQueryOptions<TData>,
): UseQueryOptions<CategoryResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  };
}

// -----------------------------------------------------

export function useCategories<TData = CategoryResponseDto[]>(
  options?: CategoryQueryOptions<TData>,
) {
  return useQuery(createCategoryQueryOptions(options));
}

//

export function useCreateCategory(options?: CategoryMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateCategorySchema>({
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
