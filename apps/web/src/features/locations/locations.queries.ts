import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createLocation, getLocations } from "./locations.api";
import type { CreateLocationDto, LocationResponseDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

type LocationOptions<TData = LocationResponseDto[]> = Omit<
  UseQueryOptions<LocationResponseDto[], ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function createLocationQueryOptions<TData = LocationResponseDto[]>(
  options?: LocationOptions<TData>,
): UseQueryOptions<LocationResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["locations"],
    queryFn: () => getLocations(),
  };
}

//

export function useLocations() {
  return useQuery(createLocationQueryOptions());
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, CreateLocationDto>({
    mutationFn: (data) => createLocation({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createLocationQueryOptions().queryKey,
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
