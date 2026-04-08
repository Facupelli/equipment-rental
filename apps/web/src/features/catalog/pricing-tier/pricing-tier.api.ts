import { apiFetch } from "@/lib/api";
import {
	setPricingTiersBodySchema,
	type SetPricingTiersDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/pricing-tiers";

export const setPricingTiers = createServerFn({ method: "POST" })
	.inputValidator((data: SetPricingTiersDto) =>
		setPricingTiersBodySchema.parse(data),
	)
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});

		return result;
	});
