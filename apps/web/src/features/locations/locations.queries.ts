import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createLocation, getLocations } from "./locations.api";
import type { CreateLocationDto, LocationResponseDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type LocationQueryOptions<TData = LocationResponseDto[]> = Omit<
  UseQueryOptions<LocationResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type LocationMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateLocationDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createLocationQueryOptions<TData = LocationResponseDto[]>(
  options?: LocationQueryOptions<TData>,
): UseQueryOptions<LocationResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["locations"],
    queryFn: () => getLocations(),
  };
}

// -----------------------------------------------------

export function useLocations<TData = LocationResponseDto[]>(
  options?: LocationQueryOptions<TData>,
) {
  return useQuery(createLocationQueryOptions(options));
}

//

export function useCreateLocation(options?: LocationMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateLocationDto>({
    ...options,
    mutationFn: (data) => createLocation({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: createLocationQueryOptions().queryKey,
      });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
