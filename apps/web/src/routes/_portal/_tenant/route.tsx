import type { TenantContext } from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { rentalTenantQueries } from "@/features/rental/tenant/tenant.queries";
import { buildR2PublicUrl } from "@/lib/r2-public-url";

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

		return {
			faviconHref:
				tenantContext.face === "portal"
					? buildR2PublicUrl(tenantContext.tenant.faviconUrl, "branding")
					: null,
		};
	},
	head: ({ loaderData }) => {
		return loaderData?.faviconHref
			? {
					links: [
						{
							rel: "icon",
							type: "image/png",
							href: loaderData.faviconHref,
						},
					],
				}
			: {};
	},
});
