import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  type PricingRuleView,
  type PaginatedDto,
  type ListPricingRulesQueryDto,
  type CreatePricingRuleDto,
  createPricingRuleSchema,
  listPricingRulesQuerySchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/pricing/rules";

export const getPricingRules = createServerFn({ method: "GET" })
  .inputValidator((data: ListPricingRulesQueryDto) =>
    listPricingRulesQuerySchema.parse(data),
  )
  .handler(async ({ data }): Promise<PaginatedDto<PricingRuleView>> => {
    const result = await apiFetchPaginated<PricingRuleView>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });

export const createPricingRule = createServerFn({ method: "POST" })
  .inputValidator((data: CreatePricingRuleDto) =>
    createPricingRuleSchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });
