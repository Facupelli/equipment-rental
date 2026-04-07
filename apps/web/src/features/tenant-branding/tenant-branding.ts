import type { ResolvedTenantContext, TenantContext } from "@repo/schemas";
import { buildR2PublicUrl } from "@/lib/r2-public-url";

export interface TenantBranding {
	tenantName: string;
	logoSrc: string | null;
	faviconHref: string | null;
}

export function getTenantBranding(tenant: TenantContext): TenantBranding {
	return {
		tenantName: tenant.name,
		logoSrc: buildR2PublicUrl(tenant.logoUrl, "branding"),
		faviconHref: buildR2PublicUrl(tenant.faviconUrl, "branding"),
	};
}

export function getResolvedTenantBranding(
	tenantContext: ResolvedTenantContext,
): TenantBranding | null {
	if (tenantContext.face !== "portal") {
		return null;
	}

	return getTenantBranding(tenantContext.tenant);
}
