import type {
	CreateOrderDto,
	GetCalendarDotsQueryDto,
	GetCalendarDotsResponseDto,
	GetOrdersQueryDto,
	GetOrdersResponseDto,
	GetOrdersScheduleQuery,
	GetOrdersScheduleResponse,
	OrderListItem,
	OrderSummary,
	ScheduleEvent,
} from "@repo/schemas";
import {
	keepPreviousData,
	queryOptions,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { Dayjs } from "dayjs";
import { fromDateParam, parseTimestamp } from "@/lib/dates/parse";
import { ProblemDetailsError } from "@/shared/errors";
import {
	createOrder,
	getCalendarDots,
	getOrders,
	getOrdersSchedule,
} from "./orders.api";

// -----------------------------------------------------
// Parsed Types
// -----------------------------------------------------

export type ParsedOrderSummary = Omit<
	OrderSummary,
	"pickupDate" | "returnDate" | "pickupAt" | "returnAt"
> & {
	pickupDate: Dayjs;
	returnDate: Dayjs;
	pickupAt: Dayjs;
	returnAt: Dayjs;
};

export type ParsedScheduleEvent = Omit<ScheduleEvent, "eventAt" | "order"> & {
	eventAt: Dayjs;
	order: ParsedOrderSummary;
};

type ParsedGetOrdersScheduleResponse = {
	events: ParsedScheduleEvent[];
};

export type ParsedOrderListItem = Omit<
	OrderListItem,
	"createdAt" | "pickupAt" | "returnAt"
> & {
	createdAt: Dayjs;
	pickupAt: Dayjs;
	returnAt: Dayjs;
};

type ParsedGetOrdersResponse = Omit<GetOrdersResponseDto, "data"> & {
	data: ParsedOrderListItem[];
};

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const orderKeys = {
	all: () => ["orders"] as const,
	lists: () => [...orderKeys.all(), "list"] as const,
	list: (params: GetOrdersQueryDto) => [...orderKeys.lists(), params] as const,
	schedules: () => [...orderKeys.all(), "schedule"] as const,
	schedule: (params: GetOrdersScheduleQuery) =>
		[...orderKeys.schedules(), params] as const,
	calendarDots: () => [...orderKeys.all(), "calendar-dots"] as const,
	calendarDot: (params: GetCalendarDotsQueryDto) =>
		[...orderKeys.calendarDots(), params] as const,
};

export const orderQueries = {
	list: <TData = ParsedGetOrdersResponse>(
		params: GetOrdersQueryDto,
		options?: GetOrdersQueryOptions<TData>,
	) =>
		queryOptions<GetOrdersResponseDto, ProblemDetailsError, TData>({
			...options,
			queryKey: orderKeys.list(params),
			queryFn: () => getOrders({ data: params }),
			placeholderData: keepPreviousData,
			select: (raw) => {
				console.log({ raw });
				const parsed = parseOrdersResponse(raw);
				return options?.select ? options.select(raw) : (parsed as TData);
			},
		}),
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type GetOrdersScheduleQueryOptions<TData = ParsedGetOrdersScheduleResponse> =
	Omit<
		UseQueryOptions<GetOrdersScheduleResponse, ProblemDetailsError, TData>,
		"queryKey" | "queryFn"
	>;

type GetOrdersQueryOptions<TData = ParsedGetOrdersResponse> = Omit<
	UseQueryOptions<GetOrdersResponseDto, ProblemDetailsError, TData>,
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
			eventAt: requireDayjs(parseTimestamp(e.eventAt), "eventAt"),
			order: {
				...e.order,
				pickupDate: fromDateParam(e.order.pickupDate),
				returnDate: fromDateParam(e.order.returnDate),
				pickupAt: requireDayjs(parseTimestamp(e.order.pickupAt), "pickupAt"),
				returnAt: requireDayjs(parseTimestamp(e.order.returnAt), "returnAt"),
			},
		})),
	};
}

function parseOrdersResponse(
	raw: GetOrdersResponseDto,
): ParsedGetOrdersResponse {
	return {
		...raw,
		data: raw.data.map((order) => ({
			...order,
			createdAt: requireDayjs(parseTimestamp(order.createdAt), "createdAt"),
			pickupAt: requireDayjs(parseTimestamp(order.pickupAt), "pickupAt"),
			returnAt: requireDayjs(parseTimestamp(order.returnAt), "returnAt"),
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

export function useOrders<TData = ParsedGetOrdersResponse>(
	params: GetOrdersQueryDto,
	options?: GetOrdersQueryOptions<TData>,
) {
	const { queryKey, queryFn, select, placeholderData } = orderQueries.list(
		params,
		options,
	);

	return useQuery({
		...options,
		queryKey,
		queryFn,
		select,
		placeholderData,
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

function requireDayjs(value: Dayjs | null, field: string): Dayjs {
	if (!value) {
		throw new Error(`Invalid order list date: ${field}`);
	}

	return value;
}
