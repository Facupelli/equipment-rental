import {
	type BundleDetailResponseDto,
	type BundleListItemResponseDto,
	type CreateBundleDto,
	CreateBundleSchema,
	type GetBundlesQueryDto,
	GetBundlesQuerySchema,
	type PaginatedDto,
	type ProblemDetails,
	type UpdateBundleDto,
	UpdateBundleSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/bundles";

export const createBundle = createServerFn({ method: "POST" })
	.inputValidator((data: CreateBundleDto) => CreateBundleSchema.parse(data))
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});

		return result;
	});

export const updateBundle = createServerFn({ method: "POST" })
	.inputValidator((data: { bundleId: string; dto: UpdateBundleDto }) => ({
		bundleId: data.bundleId,
		dto: UpdateBundleSchema.parse(data.dto),
	}))
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.bundleId}`, {
			method: "PATCH",
			body: data.dto,
		});
	});

export interface GetBundleDetailParams {
	bundleId: string;
}

const bundleDetailParamsSchema = z.object({
	bundleId: z.uuid(),
});

export const getBundleDetail = createServerFn({ method: "GET" })
	.inputValidator((data: GetBundleDetailParams) =>
		bundleDetailParamsSchema.parse(data),
	)
	.handler(async ({ data }): Promise<BundleDetailResponseDto> => {
		const result = await apiFetch<BundleDetailResponseDto>(
			`${apiUrl}/${data.bundleId}`,
			{
				method: "GET",
			},
		);

		return result;
	});

export const getBundles = createServerFn({ method: "GET" })
	.inputValidator((data: GetBundlesQueryDto) =>
		GetBundlesQuerySchema.parse(data),
	)
	.handler(
		async ({ data }): Promise<PaginatedDto<BundleListItemResponseDto>> => {
			const result = await apiFetchPaginated<BundleListItemResponseDto>(
				apiUrl,
				{
					method: "GET",
					params: data,
				},
			);

			return result;
		},
	);

export const publishBundle = createServerFn({ method: "POST" })
	.inputValidator((data: { bundleId: string }) => data)
	.handler(async ({ data }): Promise<void | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.bundleId}/publish`, {
				method: "PATCH",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}
			throw error;
		}
	});

export const retireBundle = createServerFn({ method: "POST" })
	.inputValidator((data: { bundleId: string }) => data)
	.handler(async ({ data }): Promise<void> => {
		await apiFetch<void>(`${apiUrl}/${data.bundleId}/retire`, {
			method: "PATCH",
		});
	});
