import {
	createPromotionSchema,
	type CreatePromotionDto,
	listPromotionsQuerySchema,
	type ListPromotionsQueryDto,
	listPromotionsResponseSchema,
	type ListPromotionsResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";

const apiUrl = "/pricing/promotions";

export const getPromotions = createServerFn({ method: "GET" })
	.inputValidator((data: ListPromotionsQueryDto) =>
		listPromotionsQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<ListPromotionsResponseDto> => {
		const result = await apiFetchPaginated<
			ListPromotionsResponseDto["data"][number]
		>(apiUrl, {
			method: "GET",
			params: data,
		});

		return listPromotionsResponseSchema.parse(result);
	});

export const createPromotion = createServerFn({ method: "POST" })
	.inputValidator((data: CreatePromotionDto) =>
		createPromotionSchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		return apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});
	});
