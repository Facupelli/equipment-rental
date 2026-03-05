import { apiFetch } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import type { TenantResponse } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

export const getCurrentTenant = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantResponse | null> => {
    const session = await useAppSession();

    if (!session.data.accessToken) {
      return null;
    }

    const result = await apiFetch<TenantResponse>("/tenants/me", {
      method: "GET",
    });

    return result;
  },
);
