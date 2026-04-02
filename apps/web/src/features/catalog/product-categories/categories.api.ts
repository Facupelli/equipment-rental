import {
	type CreateProductCategoryDto,
	createProductCategorySchema,
	type ProductCategoryListResponse,
	type UpdateProductCategoryDto,
	updateProductCategorySchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";

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

export const getCategories = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProductCategoryListResponse> => {
		const result = await apiFetch<ProductCategoryListResponse>(apiUrl, {
			method: "GET",
		});

		return result;
	},
);
