import {
	type AssetResponseDto,
	type CreateAssetAssignmentsResponseDto,
	type CreateAssetDto,
	type CreateBlackoutAssignmentsDto,
	type CreateMaintenanceAssignmentsDto,
	createAssetSchema,
	createBlackoutAssignmentsSchema,
	createMaintenanceAssignmentsSchema,
	type GetAssetsQuery,
	getAssetsQuerySchema,
	type PaginatedDto,
	type ProblemDetails,
	type UpdateAssetDto,
	updateAssetSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import {
	authenticatedApiFetch as apiFetch,
	authenticatedApiFetchPaginated as apiFetchPaginated,
} from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";

const apiUrl = "/assets";

export const createAsset = createServerFn({ method: "POST" })
	.inputValidator((data: CreateAssetDto) => createAssetSchema.parse(data))
	.handler(async ({ data }): Promise<string | { error: ProblemDetails }> => {
		try {
			const result = await apiFetch<string>(apiUrl, {
				method: "POST",
				body: data,
			});
			return result;
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails }; // plain serializable object — crosses boundary safely
			}
			throw error; // genuine unexpected errors can still throw
		}
	});

export const getAssets = createServerFn({ method: "GET" })
	.inputValidator((data: GetAssetsQuery) => getAssetsQuerySchema.parse(data))
	.handler(async ({ data }): Promise<PaginatedDto<AssetResponseDto>> => {
		const result = await apiFetchPaginated<AssetResponseDto>(apiUrl, {
			method: "GET",
			params: data,
		});

		return result;
	});

export const updateAsset = createServerFn({ method: "POST" })
	.inputValidator((data: { assetId: string; dto: UpdateAssetDto }) => ({
		assetId: data.assetId,
		dto: updateAssetSchema.parse(data.dto),
	}))
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.assetId}`, {
				method: "PATCH",
				body: data.dto,
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}
			throw error;
		}
	});

export const deleteAsset = createServerFn({ method: "POST" })
	.inputValidator((data: { assetId: string }) => data)
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.assetId}`, {
				method: "DELETE",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}
			throw error;
		}
	});

export const deactivateAsset = createServerFn({ method: "POST" })
	.inputValidator((data: { assetId: string }) => data)
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.assetId}/deactivate`, {
				method: "PATCH",
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}
			throw error;
		}
	});

export const createBlackoutAssignments = createServerFn({ method: "POST" })
	.inputValidator((data: CreateBlackoutAssignmentsDto) =>
		createBlackoutAssignmentsSchema.parse(data),
	)
	.handler(
		async ({
			data,
		}): Promise<
			CreateAssetAssignmentsResponseDto | { error: ProblemDetails }
		> => {
			try {
				return await apiFetch<CreateAssetAssignmentsResponseDto>(
					"/asset-assignments/blackouts",
					{
						method: "POST",
						body: data,
					},
				);
			} catch (error) {
				if (error instanceof ProblemDetailsError) {
					return { error: error.problemDetails };
				}
				throw error;
			}
		},
	);

export const createMaintenanceAssignments = createServerFn({ method: "POST" })
	.inputValidator((data: CreateMaintenanceAssignmentsDto) =>
		createMaintenanceAssignmentsSchema.parse(data),
	)
	.handler(
		async ({
			data,
		}): Promise<
			CreateAssetAssignmentsResponseDto | { error: ProblemDetails }
		> => {
			try {
				return await apiFetch<CreateAssetAssignmentsResponseDto>(
					"/asset-assignments/maintenance",
					{
						method: "POST",
						body: data,
					},
				);
			} catch (error) {
				if (error instanceof ProblemDetailsError) {
					return { error: error.problemDetails };
				}
				throw error;
			}
		},
	);
