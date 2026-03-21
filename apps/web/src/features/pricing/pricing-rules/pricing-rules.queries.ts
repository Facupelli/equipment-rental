import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getPricingRules, createPricingRule } from "./pricing-rules.api";
import type {
  PricingRuleView,
  ListPricingRulesQueryDto,
  CreatePricingRuleDto,
  PaginatedDto,
} from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";

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
