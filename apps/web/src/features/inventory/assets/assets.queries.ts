import type {
	AssetResponseDto,
	CreateAssetDto,
	GetAssetsQuery,
	PaginatedDto,
	UpdateAssetDto,
} from "@repo/schemas";
import {
	keepPreviousData,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import {
	createAsset,
	deactivateAsset,
	deleteAsset,
	getAssets,
	updateAsset,
} from "./assets.api";

type PaginatedAssets = PaginatedDto<AssetResponseDto>;

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const assetKeys = {
	all: () => ["assets"] as const,
	lists: () => [...assetKeys.all(), "list"] as const,
	list: (params: GetAssetsQuery) => [...assetKeys.lists(), params] as const,
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type AssetsOptions<TData = PaginatedAssets> = Omit<
	UseQueryOptions<PaginatedAssets, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type AssetMutationOptions = Omit<
	UseMutationOptions<string, ProblemDetailsError, CreateAssetDto>,
	"mutationFn"
>;

type UpdateAssetMutationOptions = Omit<
	UseMutationOptions<
		void,
		ProblemDetailsError,
		{ assetId: string; dto: UpdateAssetDto }
	>,
	"mutationFn"
>;

type AssetActionMutationOptions = Omit<
	UseMutationOptions<void, ProblemDetailsError, { assetId: string }>,
	"mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useAssets<TData = PaginatedAssets>(
	params: GetAssetsQuery = {},
	options?: AssetsOptions<TData>,
) {
	return useQuery({
		...options,
		queryKey: assetKeys.list(params),
		queryFn: () => getAssets({ data: params }),
		placeholderData: keepPreviousData,
	});
}

export function useCreateAsset(options?: AssetMutationOptions) {
	return useMutation<string, ProblemDetailsError, CreateAssetDto>({
		...options,
		mutationFn: async (data) => {
			const result = await createAsset({ data });
			if (typeof result === "object" && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
			return result;
		},
		meta: {
			invalidates: assetKeys.lists(),
		},
	});
}

export function useUpdateAsset(options?: UpdateAssetMutationOptions) {
	return useMutation<
		void,
		ProblemDetailsError,
		{ assetId: string; dto: UpdateAssetDto }
	>({
		...options,
		mutationFn: async (data) => {
			const result = await updateAsset({ data });
			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: assetKeys.lists(),
		},
	});
}

export function useDeleteAsset(options?: AssetActionMutationOptions) {
	return useMutation<void, ProblemDetailsError, { assetId: string }>({
		...options,
		mutationFn: async (data) => {
			const result = await deleteAsset({ data });
			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: assetKeys.lists(),
		},
	});
}

export function useDeactivateAsset(options?: AssetActionMutationOptions) {
	return useMutation<void, ProblemDetailsError, { assetId: string }>({
		...options,
		mutationFn: async (data) => {
			const result = await deactivateAsset({ data });
			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: assetKeys.lists(),
		},
	});
}
