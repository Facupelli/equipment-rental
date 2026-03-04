import { apiFetch } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import type { TenantWithBillingUnits } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

export const getCurrentTenant = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantWithBillingUnits | null> => {
    const session = await useAppSession();

    if (!session.data.accessToken) {
      return null;
    }

    const result = await apiFetch<TenantWithBillingUnits>("/tenants/me", {
      method: "GET",
    });

    return result;
  },
);
