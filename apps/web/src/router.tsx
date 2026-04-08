import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { getContext } from "./integrations/tanstack-query/root-provider";
import type { ResolvedTenantContext } from "@repo/schemas";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,

		context: {
			...getContext(),
			tenantContext: undefined as unknown as ResolvedTenantContext,
		},

		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
