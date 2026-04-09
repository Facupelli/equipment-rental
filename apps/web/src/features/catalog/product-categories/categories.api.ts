import {
	type CreateProductCategoryDto,
	createProductCategorySchema,
	type ProblemDetails,
	type ProductCategoryListResponse,
	type UpdateProductCategoryDto,
	updateProductCategorySchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { authenticatedApiFetch as apiFetch } from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/product-categories";

export const createCategory = createServerFn({ method: "POST" })
	.inputValidator((data: CreateProductCategoryDto) =>
		createProductCategorySchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});

		return result;
	});

export const updateCategory = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { categoryId: string; dto: UpdateProductCategoryDto }) => ({
			categoryId: data.categoryId,
			dto: updateProductCategorySchema.parse(data.dto),
		}),
	)
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.categoryId}`, {
			method: "PATCH",
			body: data.dto,
		});
	});

export const deleteCategory = createServerFn({ method: "POST" })
	.inputValidator((data: { categoryId: string }) => data)
	.handler(async ({ data }): Promise<void | { error: ProblemDetails }> => {
		try {
			const result = await apiFetch<void>(`${apiUrl}/${data.categoryId}`, {
				method: "DELETE",
			});
			return result;
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails }; // plain serializable object — crosses boundary safely
			}
			throw error; // genuine unexpected errors can still throw
		}
	});

export const getCategories = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProductCategoryListResponse> => {
		const result = await apiFetch<ProductCategoryListResponse>(apiUrl, {
			method: "GET",
		});

		return result;
	},
);
