import type {
	CreatePricingRuleDto,
	ListPricingRulesQueryDto,
	PaginatedDto,
	PricingRuleView,
} from "@repo/schemas";
import {
	keepPreviousData,
	queryOptions,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import {
	createPricingRule,
	deletePricingRule,
	getPricingRules,
} from "./pricing-rules.api";

type PaginatedPricingRules = PaginatedDto<PricingRuleView>;

export type PricingRulesQueryOverrides<TData = PaginatedPricingRules> = Omit<
	UseQueryOptions<PaginatedPricingRules, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

// -------------------------------------------------------
// Query Key Factory
// -------------------------------------------------------

export const pricingRuleKeys = {
	all: () => ["pricing-rules"] as const,
	lists: () => [...pricingRuleKeys.all(), "list"] as const,
	list: (params: ListPricingRulesQueryDto) =>
		[...pricingRuleKeys.lists(), params] as const,
};

// -------------------------------------------------------
// Query Options
// -------------------------------------------------------

export const pricingRuleQueries = {
	list: <TData = PaginatedPricingRules>(
		params: ListPricingRulesQueryDto,
		overrides?: PricingRulesQueryOverrides<TData>,
	) =>
		queryOptions<PaginatedPricingRules, ProblemDetailsError, TData>({
			queryKey: pricingRuleKeys.list(params),
			queryFn: () => getPricingRules({ data: params }),
			...overrides,
		}),
};

// -------------------------------------------------------
// Hooks
// -------------------------------------------------------

type CreatePricingRuleOptions = Omit<
	UseMutationOptions<string, ProblemDetailsError, CreatePricingRuleDto>,
	"mutationFn" | "mutationKey"
>;

type DeletePricingRuleOptions = Omit<
	UseMutationOptions<void, ProblemDetailsError, { pricingRuleId: string }>,
	"mutationFn" | "mutationKey"
>;

export function usePricingRules<TData = PaginatedPricingRules>(
	params: ListPricingRulesQueryDto,
	overrides?: PricingRulesQueryOverrides<TData>,
) {
	return useQuery({
		...pricingRuleQueries.list(params, overrides),
		placeholderData: keepPreviousData,
	});
}

export function useCreatePricingRule(options?: CreatePricingRuleOptions) {
	return useMutation<string, ProblemDetailsError, CreatePricingRuleDto>({
		...options,
		mutationFn: (data) => createPricingRule({ data }),
		meta: {
			invalidates: pricingRuleKeys.lists(),
		},
	});
}

export function useDeletePricingRule(options?: DeletePricingRuleOptions) {
	return useMutation<void, ProblemDetailsError, { pricingRuleId: string }>({
		...options,
		mutationFn: async ({ pricingRuleId }) => {
			const result = await deletePricingRule({ data: { pricingRuleId } });

			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: pricingRuleKeys.lists(),
		},
	});
}
