import { apiFetch } from "@/lib/api";
import type { BillingUnitListResponse } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/billing-units";

export const getBillingUnits = createServerFn({ method: "GET" }).handler(
	async (): Promise<BillingUnitListResponse> => {
		const result = await apiFetch<BillingUnitListResponse>(apiUrl, {
			method: "GET",
		});

		return result;
	},
);
