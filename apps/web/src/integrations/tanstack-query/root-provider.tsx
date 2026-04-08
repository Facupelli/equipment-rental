import type { ReactNode } from "react";
import {
	MutationCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";

let context:
	| {
			queryClient: QueryClient;
	  }
	| undefined;

export function getContext() {
	if (context) {
		return context;
	}

	const queryClient = new QueryClient({
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

	context = {
		queryClient,
	};

	return context;
}

export default function TanStackQueryProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { queryClient } = getContext();

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
