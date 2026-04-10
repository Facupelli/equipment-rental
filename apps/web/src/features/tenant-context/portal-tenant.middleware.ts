import { createMiddleware } from "@tanstack/react-start";
import type { TenantContext } from "@repo/schemas";
import { resolveTenantContextByHostname } from "./tenant-context.service";

export const portalTenantMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	const tenantContext = await resolveTenantContextByHostname();

	if (tenantContext.face !== "portal") {
		throw new Error(
			"Portal-only server function called outside portal context.",
		);
	}

	return next({
		context: {
			tenantContext: tenantContext as { face: "portal"; tenant: TenantContext },
			tenantId: tenantContext.tenant.id,
		},
	});
});
