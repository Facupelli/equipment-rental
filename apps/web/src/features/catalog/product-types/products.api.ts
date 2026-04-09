import {
	type CreateProductTypeDto,
	createProductTypeSchema,
	type GetProductTypesQuery,
	getProductTypesQuerySchema,
	type PaginatedDto,
	type ProblemDetails,
	type ProductTypeResponse,
	type UpdateProductTypeDto,
	updateProductTypeSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/product-types";

export const createProduct = createServerFn({ method: "POST" })
	.inputValidator((data: CreateProductTypeDto) =>
		createProductTypeSchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});

		return result;
	});

const updateProductSchema = z.object({
	productTypeId: z.uuid(),
	dto: updateProductTypeSchema,
});

export const updateProductType = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { productTypeId: string; dto: UpdateProductTypeDto }) =>
			updateProductSchema.parse(data),
	)
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.productTypeId}`, {
			method: "PATCH",
			body: data.dto,
		});
	});

export interface GetProductDetailParams {
	productId: string;
}

const productDetailParamsSchema = z.object({
	productId: z.uuid(),
});

export const getProductDetail = createServerFn({ method: "GET" })
	.inputValidator((data: GetProductDetailParams) =>
		productDetailParamsSchema.parse(data),
	)
	.handler(async ({ data }): Promise<ProductTypeResponse> => {
		const result = await apiFetch<ProductTypeResponse>(
			`${apiUrl}/${data.productId}`,
			{
				method: "GET",
			},
		);

		return result;
	});

export const getProducts = createServerFn({ method: "GET" })
	.inputValidator((data: GetProductTypesQuery) =>
		getProductTypesQuerySchema.parse(data),
	)
	.handler(async ({ data }): Promise<PaginatedDto<ProductTypeResponse>> => {
		const result = await apiFetchPaginated<ProductTypeResponse>(apiUrl, {
			method: "GET",
			params: data,
		});

		return result;
	});

export const publishProductType = createServerFn({ method: "POST" })
	.inputValidator((data: { productTypeId: string }) => data)
	.handler(async ({ data }): Promise<void | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.productTypeId}/publish`, {
				method: "PATCH",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}
			throw error;
		}
	});

export const retireProductType = createServerFn({ method: "POST" })
	.inputValidator((data: { productTypeId: string }) => data)
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.productTypeId}/retire`, {
			method: "PATCH",
		});
	});
