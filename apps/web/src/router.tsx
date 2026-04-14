import type { ResolvedTenantContext } from "@repo/schemas";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	// Fresh QueryClient per call — critical for Cloudflare Workers.
	// A singleton here would leak data between requests in the same isolate.
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Prevents an immediate refetch on the client right after SSR hydration.
				// Without this, the client sees hydrated data as already stale and
				// re-fetches it, wasting the SSR prefetch entirely.
				staleTime: 60 * 1000,
			},
		},
		mutationCache: new MutationCache({
			onSettled: (_data, _error, _variables, _context, mutation) => {
				if (mutation.meta?.invalidates) {
					queryClient.invalidateQueries({
						queryKey: mutation.meta.invalidates as readonly unknown[],
					});
				}
			},
		}),
	});

	const router = createTanStackRouter({
		routeTree,
		context: {
			queryClient,
			tenantContext: undefined as unknown as ResolvedTenantContext,
		},
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	// Wires up automatic SSR dehydration/hydration and streaming.
	// By default this also wraps the router with <QueryClientProvider>,
	// so you do NOT need a manual provider in __root.tsx.
	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
