import type { ProblemDetailsError } from "@/shared/errors";
import type {
  GetTodayOverviewResponse,
  GetUpcomingScheduleResponse,
} from "@repo/schemas";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getTodayOverview, getUpcomingSchedule } from "./bookings.api";

type GetTodayOverviewOptions<TData = GetTodayOverviewResponse> = Omit<
  UseQueryOptions<GetTodayOverviewResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type GetUpcomingScheduleOptions<TData = GetUpcomingScheduleResponse> = Omit<
  UseQueryOptions<GetUpcomingScheduleResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createGetTodayOverviewQueryOptions<
  TData = GetTodayOverviewResponse,
>(
  options?: GetTodayOverviewOptions<TData>,
): UseQueryOptions<GetTodayOverviewResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["today-overview"],
    queryFn: () => getTodayOverview(),
  };
}

export function createGetUpcomingScheduleQueryOptions<
  TData = GetUpcomingScheduleResponse,
>(
  options?: GetUpcomingScheduleOptions<TData>,
): UseQueryOptions<GetUpcomingScheduleResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["upcoming-schedule"],
    queryFn: () => getUpcomingSchedule(),
  };
}

// -----------------------------------------------------

export function useTodayOverview<TData = GetTodayOverviewResponse>(
  options?: GetTodayOverviewOptions<TData>,
) {
  return useQuery({
    ...createGetTodayOverviewQueryOptions(options),
  });
}

export function useUpcomingSchedule<TData = GetUpcomingScheduleResponse>(
  options?: GetUpcomingScheduleOptions<TData>,
) {
  return useQuery({
    ...createGetUpcomingScheduleQueryOptions(options),
  });
}
