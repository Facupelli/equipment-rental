import {
	type CreatePricingRuleDto,
	createPricingRuleSchema,
	type ListPricingRulesQueryDto,
	listPricingRulesQuerySchema,
	type PaginatedDto,
	type PricingRuleView,
	type ProblemDetails,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch, apiFetchPaginated } from "@/lib/api";
import { ProblemDetailsError } from "@/shared/errors";

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

export const deletePricingRule = createServerFn({ method: "POST" })
	.inputValidator((data: { pricingRuleId: string }) => data)
	.handler(async ({ data }): Promise<undefined | { error: ProblemDetails }> => {
		try {
			await apiFetch<void>(`${apiUrl}/${data.pricingRuleId}`, {
				method: "DELETE",
			});

			return undefined;
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				return { error: error.problemDetails };
			}

			throw error;
		}
	});
