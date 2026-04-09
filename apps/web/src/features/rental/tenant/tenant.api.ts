import type { TenantPricingConfig } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { resolveTenantContextByHostname } from "@/features/tenant-context/tenant-context.service";
import { storefrontApiFetch } from "@/lib/storefront-api";

async function getPortalTenantId(): Promise<string> {
  const tenantContext = await resolveTenantContextByHostname();

  if (tenantContext.face !== "portal") {
    throw new Error(
      "Portal customer auth is only available on tenant portal domains.",
    );
  }

  return tenantContext.tenant.id;
}

const apiUrl = "/tenant";

export const getTenantPricingConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantPricingConfig> => {
    const tenantId = await getPortalTenantId();

    const result = await storefrontApiFetch<TenantPricingConfig>(
      `${apiUrl}/${tenantId}/pricing-config`,
      {
        method: "GET",
      },
    );

    return result;
  },
);
