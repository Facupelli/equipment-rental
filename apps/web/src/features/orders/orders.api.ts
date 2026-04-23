import {
	type CreateOrderDto,
	createOrderSchema,
	type GetCalendarDotsQueryDto,
	GetCalendarDotsQuerySchema,
	type GetCalendarDotsResponseDto,
	type GetOrderByIdParamDto,
	type GetOrdersCalendarQueryDto,
	GetOrdersCalendarQuerySchema,
	type GetOrdersCalendarResponse,
	type GetOrdersQueryDto,
	type GetOrdersResponseDto,
	type GetOrdersScheduleQuery,
	GetOrdersScheduleQuerySchema,
	type GetOrdersScheduleResponse,
	getOrderByIdParamSchema,
	getOrdersQuerySchema,
	type OrderDetailResponseDto,
	type OrderListItem,
	type ProblemDetails,
} from "@repo/schemas";
import { ActorType } from "@repo/types";
import { createServerFn } from "@tanstack/react-start";
import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/orders";

export const getOrders = createServerFn({ method: "GET" })
	.inputValidator((data: GetOrdersQueryDto) => getOrdersQuerySchema.parse(data))
	.handler(async ({ data }): Promise<GetOrdersResponseDto> => {
		const result = await apiFetchPaginated<OrderListItem>(apiUrl, {
			method: "GET",
			params: data,
		});

		return result;
	});

export const getOrdersSchedule = createServerFn({ method: "GET" })
	.inputValidator((data: GetOrdersScheduleQuery) =>
		GetOrdersScheduleQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<GetOrdersScheduleResponse> => {
		const result = await apiFetch<GetOrdersScheduleResponse>(
			`${apiUrl}/schedule`,
			{
				method: "GET",
				params: data,
			},
		);

		return result;
	});

export const getCalendarDots = createServerFn({ method: "GET" })
	.inputValidator((data: GetCalendarDotsQueryDto) =>
		GetCalendarDotsQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<GetCalendarDotsResponseDto> => {
		const result = await apiFetch<GetCalendarDotsResponseDto>(
			`${apiUrl}/calendar-dots`,
			{
				method: "GET",
				params: data,
			},
		);

		return result;
	});

export const getOrdersCalendar = createServerFn({ method: "GET" })
	.inputValidator((data: GetOrdersCalendarQueryDto) =>
		GetOrdersCalendarQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<GetOrdersCalendarResponse> => {
		const result = await apiFetch<GetOrdersCalendarResponse>(
			`${apiUrl}/calendar`,
			{
				method: "GET",
				params: data,
			},
		);

		return result;
	});

export const getOrderById = createServerFn({ method: "GET" })
	.inputValidator((data: GetOrderByIdParamDto) =>
		getOrderByIdParamSchema.parse(data),
	)
	.handler(async ({ data }): Promise<OrderDetailResponseDto> => {
		const result = await apiFetch<OrderDetailResponseDto>(
			`${apiUrl}/${data.orderId}`,
			{
				method: "GET",
			},
		);

		return result;
	});

export const createOrder = createServerFn({ method: "POST" })
	.inputValidator((data: CreateOrderDto) => createOrderSchema.parse(data))
	.handler(async ({ data }): Promise<string | { error: ProblemDetails }> => {
		try {
			const result = await apiFetch<string>(apiUrl, {
				method: "POST",
				body: data,
				actorType: ActorType.CUSTOMER,
			});

			return result;
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}
			throw error;
		}
	});

export const markEquipmentAsReturned = createServerFn({ method: "POST" })
	.inputValidator((data: GetOrderByIdParamDto) =>
		getOrderByIdParamSchema.parse(data),
	)
	.handler(async ({ data }): Promise<void | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(
				`${apiUrl}/${data.orderId}/mark-equipment-returned`,
				{
					method: "POST",
				},
			);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});

export const cancelOrder = createServerFn({ method: "POST" })
	.inputValidator((data: GetOrderByIdParamDto) =>
		getOrderByIdParamSchema.parse(data),
	)
	.handler(async ({ data }): Promise<void | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.orderId}/cancel`, {
				method: "POST",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});

export const markEquipmentAsRetired = createServerFn({ method: "POST" })
	.inputValidator((data: GetOrderByIdParamDto) =>
		getOrderByIdParamSchema.parse(data),
	)
	.handler(async ({ data }): Promise<void | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.orderId}/mark-equipment-retired`, {
				method: "POST",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});
