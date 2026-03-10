import { ProblemDetailsError } from "@/shared/errors";
import type {
  GetOrderByIdParamDto,
  OrderDetailResponseDto,
} from "@repo/schemas";
import { useQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query";
import type { Dayjs } from "dayjs";
import { fromDate, parseTimestamp } from "@/lib/dates/parse";
import { getOrderById } from "../orders.api";

// TODO: replace parseDailyBound with parseTimestamp for hourly orders once
// rentalType is available on OrderDetailResponseDto (tracked: BillingUnit.type).
export type ParsedOrderPeriod = {
  start: Dayjs;
  end: Dayjs;
};

export type ParsedOrderDetailResponseDto = Omit<
  OrderDetailResponseDto,
  "period" | "createdAt"
> & {
  period: ParsedOrderPeriod | null;
  createdAt: Dayjs;
};

// -----------------------------------------------------

type GetOrderByIdQueryOptions<TData = OrderDetailResponseDto> = Omit<
  UseSuspenseQueryOptions<OrderDetailResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

function parseOrderDetailResponse(
  raw: OrderDetailResponseDto,
): ParsedOrderDetailResponseDto {
  return {
    ...raw,
    // TODO: route through parseTimestamp for hourly orders once rentalType is available
    period: raw.period
      ? {
          start: fromDate(raw.period.start)!,
          end: fromDate(raw.period.end)!,
        }
      : null,
    createdAt: parseTimestamp(raw.createdAt)!,
  };
}

// -----------------------------------------------------

export function createOrderDetailQueryOptions<
  TData = ParsedOrderDetailResponseDto,
>(
  params: GetOrderByIdParamDto,
  options?: GetOrderByIdQueryOptions<TData>,
): UseSuspenseQueryOptions<OrderDetailResponseDto, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["order", params],
    queryFn: () => getOrderById({ data: params }),
    select: (raw) => parseOrderDetailResponse(raw) as TData,
  };
}

// -----------------------------------------------------

export function useOrderDetail<TData = ParsedOrderDetailResponseDto>(
  params: GetOrderByIdParamDto,
  options?: GetOrderByIdQueryOptions<TData>,
) {
  return useQuery({
    ...createOrderDetailQueryOptions(params, options),
  });
}
