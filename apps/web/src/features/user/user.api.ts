import { authenticatedApiFetch as apiFetch } from "@/lib/api-auth";
import type { MeResponse } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<MeResponse> => {
		const result = await apiFetch<MeResponse>("/users/me", {
			method: "GET",
		});

		return result;
	},
);
