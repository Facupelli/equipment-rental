import type {
	ListPromotionsQueryDto,
	ListPromotionsResponseDto,
	PromotionView,
} from "@repo/schemas";
import {
	keepPreviousData,
	queryOptions,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import type { ProblemDetailsError } from "@/shared/errors";
import { getPromotion, getPromotions } from "./promotions.api";

type PaginatedPromotions = ListPromotionsResponseDto;
type Promotion = PromotionView;

export type PromotionsQueryOverrides<TData = PaginatedPromotions> = Omit<
	UseQueryOptions<PaginatedPromotions, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

export type PromotionQueryOverrides<TData = Promotion> = Omit<
	UseQueryOptions<Promotion, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

export const promotionKeys = {
	all: () => ["promotions"] as const,
	details: () => [...promotionKeys.all(), "detail"] as const,
	detail: (promotionId: string) =>
		[...promotionKeys.details(), promotionId] as const,
	lists: () => [...promotionKeys.all(), "list"] as const,
	list: (params: ListPromotionsQueryDto) =>
		[...promotionKeys.lists(), params] as const,
};

export const promotionQueries = {
	detail: <TData = Promotion>(
		promotionId: string,
		overrides?: PromotionQueryOverrides<TData>,
	) =>
		queryOptions<Promotion, ProblemDetailsError, TData>({
			queryKey: promotionKeys.detail(promotionId),
			queryFn: () => getPromotion({ data: { promotionId } }),
			...overrides,
		}),
	list: <TData = PaginatedPromotions>(
		params: ListPromotionsQueryDto,
		overrides?: PromotionsQueryOverrides<TData>,
	) =>
		queryOptions<PaginatedPromotions, ProblemDetailsError, TData>({
			queryKey: promotionKeys.list(params),
			queryFn: () => getPromotions({ data: params }),
			...overrides,
		}),
};

export function usePromotions<TData = PaginatedPromotions>(
	params: ListPromotionsQueryDto,
	overrides?: PromotionsQueryOverrides<TData>,
) {
	return useQuery({
		...promotionQueries.list(params, overrides),
		placeholderData: keepPreviousData,
	});
}

export function usePromotion<TData = Promotion>(
	promotionId: string,
	overrides?: PromotionQueryOverrides<TData>,
) {
	return useQuery(promotionQueries.detail(promotionId, overrides));
}
