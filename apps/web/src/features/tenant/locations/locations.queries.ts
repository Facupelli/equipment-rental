import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createLocation, getLocations } from "./locations.api";
import type { ProblemDetailsError } from "@/shared/errors";
import type { CreateLocationDto, LocationListResponse } from "@repo/schemas";

type LocationQueryOptions<TData = LocationListResponse> = Omit<
  UseQueryOptions<LocationListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type LocationMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateLocationDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createLocationQueryOptions<TData = LocationListResponse>(
  options?: LocationQueryOptions<TData>,
): UseQueryOptions<LocationListResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["locations"],
    queryFn: () => getLocations(),
  };
}

// -----------------------------------------------------

export function useLocations<TData = LocationListResponse>(
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
