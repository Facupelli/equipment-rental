import { ProblemDetailsError } from "@/shared/errors";
import type {
  CreateOrderDto,
  GetCalendarDotsQueryDto,
  GetCalendarDotsResponseDto,
  GetOrdersScheduleQuery,
  GetOrdersScheduleResponse,
  OrderSummary,
  ScheduleEvent,
} from "@repo/schemas";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createOrder, getCalendarDots, getOrdersSchedule } from "./orders.api";
import type { Dayjs } from "dayjs";
import { parseDailyBound } from "@/lib/dates/parse";

// -----------------------------------------------------
// Parsed Types
// -----------------------------------------------------

export type ParsedOrderSummary = Omit<
  OrderSummary,
  "periodStart" | "periodEnd"
> & {
  periodStart: Dayjs;
  periodEnd: Dayjs;
};

export type ParsedScheduleEvent = Omit<ScheduleEvent, "eventDate" | "order"> & {
  eventDate: Dayjs;
  order: ParsedOrderSummary;
};

type ParsedGetOrdersScheduleResponse = {
  events: ParsedScheduleEvent[];
};

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const orderKeys = {
  all: () => ["orders"] as const,
  schedules: () => [...orderKeys.all(), "schedule"] as const,
  schedule: (params: GetOrdersScheduleQuery) =>
    [...orderKeys.schedules(), params] as const,
  calendarDots: () => [...orderKeys.all(), "calendar-dots"] as const,
  calendarDot: (params: GetCalendarDotsQueryDto) =>
    [...orderKeys.calendarDots(), params] as const,
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type GetOrdersScheduleQueryOptions<TData = ParsedGetOrdersScheduleResponse> =
  Omit<
    UseQueryOptions<GetOrdersScheduleResponse, ProblemDetailsError, TData>,
    "queryKey" | "queryFn"
  >;

type GetCalendarDotsQueryOptions<TData = GetCalendarDotsResponseDto> = Omit<
  UseQueryOptions<GetCalendarDotsResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type OrderMutationOptions = Omit<
  UseMutationOptions<string, ProblemDetailsError, CreateOrderDto>,
  "mutationFn"
>;

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function parseScheduleResponse(
  raw: GetOrdersScheduleResponse,
): ParsedGetOrdersScheduleResponse {
  return {
    events: raw.events.map((e) => ({
      ...e,
      eventDate: parseDailyBound(e.eventDate)!,
      order: {
        ...e.order,
        periodStart: parseDailyBound(e.order.periodStart)!,
        periodEnd: parseDailyBound(e.order.periodEnd)!,
      },
    })),
  };
}

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useUpcomingSchedule<TData = ParsedGetOrdersScheduleResponse>(
  params: GetOrdersScheduleQuery,
  options?: GetOrdersScheduleQueryOptions<TData>,
) {
  return useQuery({
    ...options,
    queryKey: orderKeys.schedule(params),
    queryFn: () => getOrdersSchedule({ data: params }),
    select: (raw) => {
      const parsed = parseScheduleResponse(raw);
      return options?.select ? options.select(raw) : (parsed as TData);
    },
  });
}

export function useCalendarDots<TData = GetCalendarDotsResponseDto>(
  params: GetCalendarDotsQueryDto,
  options?: GetCalendarDotsQueryOptions<TData>,
) {
  return useQuery({
    ...options,
    queryKey: orderKeys.calendarDot(params),
    queryFn: () => getCalendarDots({ data: params }),
  });
}

export function useCreateOrder(options?: OrderMutationOptions) {
  return useMutation<string, ProblemDetailsError, CreateOrderDto>({
    ...options,
    mutationFn: async (data) => {
      const result = await createOrder({ data });
      if (typeof result === "object" && "error" in result) {
        throw new ProblemDetailsError(result.error);
      }
      return result;
    },
    meta: {
      invalidates: orderKeys.all(),
    },
  });
}
