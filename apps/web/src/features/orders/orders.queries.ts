import { ProblemDetailsError } from "@/shared/errors";
import type {
  CreateOrderDto,
  GetOrdersScheduleQuery,
  GetOrdersScheduleResponse,
} from "@repo/schemas";
import {
  useMutation,
  useQuery,
  type MutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createOrder, getOrdersSchedule } from "./orders.api";

type GetOrdersScheduleQueryOptions<TData = GetOrdersScheduleResponse> = Omit<
  UseQueryOptions<GetOrdersScheduleResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type OrderMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateOrderDto>,
  "mutationFn" | "mutationKey"
>;

// -----------------------------------------------------

export function createOrdersScheduleQueryOptions<
  TData = GetOrdersScheduleResponse,
>(
  params: GetOrdersScheduleQuery,
  options?: GetOrdersScheduleQueryOptions<TData>,
): UseQueryOptions<GetOrdersScheduleResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["orders-schedule", params],
    queryFn: () => getOrdersSchedule({ data: params }),
  };
}

// -----------------------------------------------------

export function useUpcomingSchedule<TData = GetOrdersScheduleResponse>(
  params: GetOrdersScheduleQuery,
  options?: GetOrdersScheduleQueryOptions<TData>,
) {
  return useQuery({
    ...createOrdersScheduleQueryOptions(params, options),
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
