import { apiFetch } from "@/lib/api";
import type {
  GetTodayOverviewResponse,
  GetUpcomingScheduleResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/bookings";

export const getTodayOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<GetTodayOverviewResponse> => {
    const result = await apiFetch<GetTodayOverviewResponse>(
      `${apiUrl}/today-overview`,
      {
        method: "GET",
      },
    );

    return result;
  },
);

export const getUpcomingSchedule = createServerFn({ method: "GET" }).handler(
  async (): Promise<GetUpcomingScheduleResponse> => {
    const result = await apiFetch<GetUpcomingScheduleResponse>(
      `${apiUrl}/upcoming-schedule`,
      {
        method: "GET",
      },
    );

    return result;
  },
);
