import { Route as PortalRoute } from "@/routes/_portal/route";

export function usePortalTenantId(): string {
	const { tenantContext } = PortalRoute.useRouteContext();

	if (tenantContext.face !== "portal") {
		throw new Error(
			"usePortalTenantId must be used within the portal route tree.",
		);
	}

	return tenantContext.tenant.id;
}
