import type { TenantContext } from "@repo/schemas";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getTenantBranding } from "@/features/tenant-branding/tenant-branding";

export const Route = createFileRoute("/_portal")({
	beforeLoad: ({ context }) => {
		if (context.tenantContext.face !== "portal") {
			throw redirect({ to: "/admin/login" });
		}

		return {
			tenantContext: context.tenantContext as {
				face: "portal";
				tenant: TenantContext;
			},
		};
	},
	loader: ({ context: { tenantContext } }) => ({
		branding: getTenantBranding(tenantContext.tenant),
	}),
	head: ({ loaderData }) =>
		loaderData?.branding.faviconHref
			? {
					links: [
						{
							rel: "icon",
							type: "image/png",
							href: loaderData.branding.faviconHref,
						},
					],
				}
			: {},
});
