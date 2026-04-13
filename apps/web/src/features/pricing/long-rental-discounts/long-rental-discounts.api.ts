import {
	createLongRentalDiscountSchema,
	type CreateLongRentalDiscountDto,
	listLongRentalDiscountsQuerySchema,
	type ListLongRentalDiscountsQueryDto,
	listLongRentalDiscountsResponseSchema,
	type ListLongRentalDiscountsResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";

const apiUrl = "/pricing/long-rental-discounts";

export const getLongRentalDiscounts = createServerFn({ method: "GET" })
	.inputValidator((data: ListLongRentalDiscountsQueryDto) =>
		listLongRentalDiscountsQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<ListLongRentalDiscountsResponseDto> => {
		const result = await apiFetchPaginated<
			ListLongRentalDiscountsResponseDto["data"][number]
		>(apiUrl, {
			method: "GET",
			params: data,
		});

		return listLongRentalDiscountsResponseSchema.parse(result);
	});

export const createLongRentalDiscount = createServerFn({ method: "POST" })
	.inputValidator((data: CreateLongRentalDiscountDto) =>
		createLongRentalDiscountSchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		return apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});
	});
