import type {
	ListPromotionsQueryDto,
	ListPromotionsResponseDto,
} from "@repo/schemas";
import {
	keepPreviousData,
	queryOptions,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import type { ProblemDetailsError } from "@/shared/errors";
import { getPromotions } from "./promotions.api";

type PaginatedPromotions = ListPromotionsResponseDto;

export type PromotionsQueryOverrides<TData = PaginatedPromotions> = Omit<
	UseQueryOptions<PaginatedPromotions, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

export const promotionKeys = {
	all: () => ["promotions"] as const,
	lists: () => [...promotionKeys.all(), "list"] as const,
	list: (params: ListPromotionsQueryDto) =>
		[...promotionKeys.lists(), params] as const,
};

export const promotionQueries = {
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
