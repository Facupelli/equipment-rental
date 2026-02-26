import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createCategory, getCategories } from "./categories.api";
import type { CategoryResponseDto, CreateCategorySchema } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type CategoryOptions<TData = CategoryResponseDto[]> = Omit<
  UseQueryOptions<CategoryResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function createCategoryQueryOptions<TData = CategoryResponseDto[]>(
  options?: CategoryOptions<TData>,
): UseQueryOptions<CategoryResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  };
}

//

export function useCategories() {
  return useQuery(createCategoryQueryOptions());
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateCategorySchema>({
    mutationFn: (data) => createCategory({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createCategoryQueryOptions().queryKey,
      });
    },
    onError: (error) => {
      // error is fully typed as ProblemDetailsError here.
      // You can log, toast, or handle it however you like.
      console.error(
        `[${error.problemDetails.status}] ${error.problemDetails.detail}`,
      );
    },
  });
}
