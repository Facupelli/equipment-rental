import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createOwner, getOwners } from "./owners.api";
import type { CreateOwnerDto, OwnerResponseDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type OwnerOptions<TData = OwnerResponseDto[]> = Omit<
  UseQueryOptions<OwnerResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function createOwnerQueryOptions<TData = OwnerResponseDto[]>(
  options?: OwnerOptions<TData>,
): UseQueryOptions<OwnerResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["owners"],
    queryFn: () => getOwners(),
  };
}

//

export function useOwners() {
  return useQuery(createOwnerQueryOptions());
}

export function useCreateOwner() {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateOwnerDto>({
    mutationFn: (data) => createOwner({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createOwnerQueryOptions().queryKey,
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
