import { apiFetch } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import type { TenantResponseDto } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

export const getCurrentTenant = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantResponseDto | null> => {
    const session = await useAppSession();

    if (!session.data.accessToken) {
      return null;
    }

    const result = await apiFetch<TenantResponseDto>("/tenancy/me", {
      method: "GET",
    });

    return result;
  },
);
