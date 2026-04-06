import {
	type BundleListResponseDto,
	type CalculateCartPricesRequest,
	type CartPriceResult,
	calculateCartPricesRequestSchema,
	type GetCombosParams,
	type GetNewArrivalsParams,
	type GetProductTypesQuery,
	getBundleParamsSchema,
	getNewArrivalsParamsSchema,
	getRentalProductQuerySchema,
	type NewArrivalListResponseDto,
	type PaginatedDto,
	type RentalProductResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch, apiFetchPaginated } from "@/lib/api";

const apiUrl = "/rental";

export interface GetProductDetailParams {
	productId: string;
}

export const getRentalProducts = createServerFn({ method: "GET" })
	.inputValidator((data: GetProductTypesQuery) =>
		getRentalProductQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<PaginatedDto<RentalProductResponse>> => {
		const result = await apiFetchPaginated<RentalProductResponse>(
			`${apiUrl}/product-types`,
			{
				authenticated: false,
				face: "portal",
				method: "GET",
				params: data,
			},
		);

		return result;
	});

export const getNewArrivals = createServerFn({ method: "GET" })
	.inputValidator((data: GetNewArrivalsParams) =>
		getNewArrivalsParamsSchema.parse(data),
	)
	.handler(async ({ data }): Promise<NewArrivalListResponseDto> => {
		return await apiFetch<NewArrivalListResponseDto>(`${apiUrl}/new-arrivals`, {
			authenticated: false,
			face: "portal",
			method: "GET",
			params: data,
		});
	});

export const getRentalBundles = createServerFn({ method: "GET" })
	.inputValidator((data: GetCombosParams) => getBundleParamsSchema.parse(data))
	.handler(async ({ data }): Promise<BundleListResponseDto> => {
		return await apiFetch<BundleListResponseDto>(`${apiUrl}/bundles`, {
			authenticated: false,
			face: "portal",
			method: "GET",
			params: data,
		});
	});

export const getCartPricePreview = createServerFn({ method: "POST" })
	.inputValidator((data: CalculateCartPricesRequest) =>
		calculateCartPricesRequestSchema.parse(data),
	)
	.handler(async ({ data }): Promise<CartPriceResult> => {
		const result = await apiFetch<CartPriceResult>("/pricing/cart/preview", {
			authenticated: false,
			face: "portal",
			method: "POST",
			body: data,
		});

		return result;
	});
