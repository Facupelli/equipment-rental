import type { ProductCategoryListResponse } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

import { apiFetch } from "@/lib/api";

const apiUrl = "/rental/categories";

export const getRentalCategories = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProductCategoryListResponse> => {
		const result = await apiFetch<ProductCategoryListResponse>(apiUrl, {
			authenticated: false,
			face: "portal",
			method: "GET",
		});

		return result;
	},
);
