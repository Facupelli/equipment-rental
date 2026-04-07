import type { TenantContext } from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { rentalTenantQueries } from "@/features/rental/tenant/tenant.queries";

export const Route = createFileRoute("/_portal/_tenant")({
	beforeLoad: ({ context }) => {
		const { tenantContext } = context;

		if (tenantContext.face !== "portal") {
			// This branch is unreachable in practice — the _portal namespace only
			// resolves for tenant-facing hostnames.
			throw new Error(
				"Invariant violated: _tenant route reached outside portal context",
			);
		}

		return {
			// Re-expose as the narrowed type.
			tenantContext: tenantContext as { face: "portal"; tenant: TenantContext },
		};
	},
	loader: async ({ context: { queryClient, tenantContext } }) => {
		await queryClient.ensureQueryData(rentalTenantQueries.me());
	},
});
