import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";
import {
	createOrderSchema,
	getOrdersQuerySchema,
	GetCalendarDotsQuerySchema,
	getOrderByIdParamSchema,
	GetOrdersScheduleQuerySchema,
	type CreateOrderDto,
	type GetOrdersQueryDto,
	type OrderListItem,
	type GetOrdersResponseDto,
	type GetCalendarDotsQueryDto,
	type GetCalendarDotsResponseDto,
	type GetOrderByIdParamDto,
	type GetOrdersScheduleQuery,
	type GetOrdersScheduleResponse,
	type OrderDetailResponseDto,
	type ProblemDetails,
} from "@repo/schemas";
import { ActorType } from "@repo/types";
import { createServerFn } from "@tanstack/react-start";

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
