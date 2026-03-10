import { ProblemDetailsError } from "@/shared/errors";
import type {
  CreateOrderDto,
  GetOrdersScheduleQuery,
  GetOrdersScheduleResponse,
  OrderSummary,
  ScheduleEvent,
} from "@repo/schemas";
import {
  useMutation,
  useQuery,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createOrder, getOrdersSchedule } from "./orders.api";
import type { Dayjs } from "dayjs";
import { parseDailyBound } from "@/lib/dates/parse";

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

type GetOrdersScheduleQueryOptions<TData = GetOrdersScheduleResponse> = Omit<
  UseQueryOptions<GetOrdersScheduleResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type OrderMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateOrderDto>,
  "mutationFn" | "mutationKey"
>;

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

export function getOrdersScheduleQueryOptions<
  TData = ParsedGetOrdersScheduleResponse,
>(
  params: GetOrdersScheduleQuery,
  options?: GetOrdersScheduleQueryOptions<TData>,
): UseQueryOptions<GetOrdersScheduleResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["orders-schedule", params],
    queryFn: () => getOrdersSchedule({ data: params }),
    select: (raw) => parseScheduleResponse(raw) as TData,
  };
}

// -----------------------------------------------------

export function useUpcomingSchedule<TData = ParsedGetOrdersScheduleResponse>(
  params: GetOrdersScheduleQuery,
  options?: GetOrdersScheduleQueryOptions<TData>,
) {
  return useQuery({
    ...getOrdersScheduleQueryOptions(params, options),
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
