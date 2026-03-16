import {
  queryOptions,
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createLocation, getLocations } from "./locations.api";
import type { ProblemDetailsError } from "@/shared/errors";
import type { CreateLocationDto, LocationListResponse } from "@repo/schemas";

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const locationKeys = {
  all: () => ["locations"] as const,
  lists: () => [...locationKeys.all(), "list"] as const,
};

export const locationQueries = {
  list: () =>
    queryOptions<LocationListResponse, ProblemDetailsError>({
      queryKey: locationKeys.lists(),
      queryFn: () => getLocations(),
    }),
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type LocationQueryOptions<TData = LocationListResponse> = Omit<
  UseQueryOptions<LocationListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type LocationMutationOptions = Omit<
  UseMutationOptions<string, ProblemDetailsError, CreateLocationDto>,
  "mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useLocations<TData = LocationListResponse>(
  options?: LocationQueryOptions<TData>,
) {
  const { queryKey, queryFn } = locationQueries.list();

  return useQuery({
    ...options,
    queryKey,
    queryFn,
  });
}

export function useCreateLocation(options?: LocationMutationOptions) {
  return useMutation<string, ProblemDetailsError, CreateLocationDto>({
    ...options,
    mutationFn: (data) => createLocation({ data }),
    meta: {
      invalidates: locationKeys.lists(),
    },
  });
}
