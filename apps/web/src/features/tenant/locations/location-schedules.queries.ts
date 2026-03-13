import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getLocationSchedules,
  createLocationSchedule,
  updateLocationSchedule,
  bulkCreateLocationSchedules,
} from "./location-schedules.api";
import type { ProblemDetailsError } from "@/shared/errors";
import type {
  AddScheduleToLocationDto,
  LocationScheduleResponseDto,
} from "@repo/schemas";

// ---------------------------------------------------------------------------

type LocationSchedulesQueryOptions<TData = LocationScheduleResponseDto[]> =
  Omit<
    UseQueryOptions<LocationScheduleResponseDto[], ProblemDetailsError, TData>,
    "queryKey" | "queryFn"
  >;

type CreateScheduleMutationOptions = Omit<
  MutationOptions<
    LocationScheduleResponseDto,
    ProblemDetailsError,
    { locationId: string; dto: AddScheduleToLocationDto }
  >,
  "mutationFn" | "mutationKey"
>;

type BulkCreateScheduleMutationOptions = Omit<
  MutationOptions<
    LocationScheduleResponseDto[],
    ProblemDetailsError,
    { locationId: string; items: AddScheduleToLocationDto[] }
  >,
  "mutationFn" | "mutationKey"
>;

type UpdateScheduleMutationOptions = Omit<
  MutationOptions<
    LocationScheduleResponseDto,
    ProblemDetailsError,
    { locationId: string; scheduleId: string; dto: AddScheduleToLocationDto }
  >,
  "mutationFn" | "mutationKey"
>;

// ---------------------------------------------------------------------------

export const locationSchedulesQueryKeys = {
  all: (locationId: string) => ["locations", locationId, "schedules"] as const,
};

// ---------------------------------------------------------------------------

export function createLocationSchedulesQueryOptions<
  TData = LocationScheduleResponseDto[],
>(
  locationId: string,
  options?: LocationSchedulesQueryOptions<TData>,
): UseQueryOptions<LocationScheduleResponseDto[], ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: locationSchedulesQueryKeys.all(locationId),
    queryFn: () => getLocationSchedules({ data: { locationId } }),
  };
}

// ---------------------------------------------------------------------------

export function useLocationSchedules<TData = LocationScheduleResponseDto[]>(
  locationId: string,
  options?: LocationSchedulesQueryOptions<TData>,
) {
  return useQuery(createLocationSchedulesQueryOptions(locationId, options));
}

// ---------------------------------------------------------------------------

export function useCreateLocationSchedule(
  options?: CreateScheduleMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<
    LocationScheduleResponseDto,
    ProblemDetailsError,
    { locationId: string; dto: AddScheduleToLocationDto }
  >({
    ...options,
    mutationFn: ({ locationId, dto }) =>
      createLocationSchedule({ data: { locationId, dto } }),
    onSuccess: async (data, variables, context, onMutateResult) => {
      await queryClient.invalidateQueries({
        queryKey: locationSchedulesQueryKeys.all(variables.locationId),
      });

      await options?.onSuccess?.(data, variables, context, onMutateResult);
    },
    onError: async (error, variables, context, onMutateResult) => {
      await options?.onError?.(error, variables, context, onMutateResult);
    },
  });
}

export function useBulkCreateLocationSchedules(
  options?: BulkCreateScheduleMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<
    LocationScheduleResponseDto[],
    ProblemDetailsError,
    { locationId: string; items: AddScheduleToLocationDto[] }
  >({
    ...options,
    mutationFn: ({ locationId, items }) =>
      bulkCreateLocationSchedules({ data: { locationId, items } }),
    onSuccess: async (data, variables, context, onMutateResult) => {
      await queryClient.invalidateQueries({
        queryKey: locationSchedulesQueryKeys.all(variables.locationId),
      });

      await options?.onSuccess?.(data, variables, context, onMutateResult);
    },
    onError: async (error, variables, context, onMutateResult) => {
      await options?.onError?.(error, variables, context, onMutateResult);
    },
  });
}

// ---------------------------------------------------------------------------

export function useUpdateLocationSchedule(
  options?: UpdateScheduleMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<
    LocationScheduleResponseDto,
    ProblemDetailsError,
    { locationId: string; scheduleId: string; dto: AddScheduleToLocationDto }
  >({
    ...options,
    mutationFn: ({ locationId, scheduleId, dto }) =>
      updateLocationSchedule({ data: { locationId, scheduleId, dto } }),
    onSuccess: async (data, variables, context, onMutateResult) => {
      await queryClient.invalidateQueries({
        queryKey: locationSchedulesQueryKeys.all(variables.locationId),
      });

      await options?.onSuccess?.(data, variables, context, onMutateResult);
    },
    onError: async (error, variables, context, onMutateResult) => {
      await options?.onError?.(error, variables, context, onMutateResult);
    },
  });
}
