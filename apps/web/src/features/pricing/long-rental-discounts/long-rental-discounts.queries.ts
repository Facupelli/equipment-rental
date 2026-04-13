import {
	keepPreviousData,
	queryOptions,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import type {
	ListLongRentalDiscountsQueryDto,
	ListLongRentalDiscountsResponseDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";
import { getLongRentalDiscounts } from "./long-rental-discounts.api";

type PaginatedLongRentalDiscounts = ListLongRentalDiscountsResponseDto;

export type LongRentalDiscountsQueryOverrides<
	TData = PaginatedLongRentalDiscounts,
> = Omit<
	UseQueryOptions<PaginatedLongRentalDiscounts, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

export const longRentalDiscountKeys = {
	all: () => ["long-rental-discounts"] as const,
	lists: () => [...longRentalDiscountKeys.all(), "list"] as const,
	list: (params: ListLongRentalDiscountsQueryDto) =>
		[...longRentalDiscountKeys.lists(), params] as const,
};

export const longRentalDiscountQueries = {
	list: <TData = PaginatedLongRentalDiscounts>(
		params: ListLongRentalDiscountsQueryDto,
		overrides?: LongRentalDiscountsQueryOverrides<TData>,
	) =>
		queryOptions<PaginatedLongRentalDiscounts, ProblemDetailsError, TData>({
			queryKey: longRentalDiscountKeys.list(params),
			queryFn: () => getLongRentalDiscounts({ data: params }),
			...overrides,
		}),
};

export function useLongRentalDiscounts<TData = PaginatedLongRentalDiscounts>(
	params: ListLongRentalDiscountsQueryDto,
	overrides?: LongRentalDiscountsQueryOverrides<TData>,
) {
	return useQuery({
		...longRentalDiscountQueries.list(params, overrides),
		placeholderData: keepPreviousData,
	});
}
