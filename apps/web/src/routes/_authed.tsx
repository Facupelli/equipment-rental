import { getCurrentUser } from "@/features/auth/auth.api";
import { ensureValidSession } from "@/features/auth/get-session";
import { getCurrentTenant } from "@/features/tenant/tenant.api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const { accessToken } = await ensureValidSession();
    return { accessToken };
  },
  loader: async () => {
    const [user, tenant] = await Promise.all([
      getCurrentUser(),
      getCurrentTenant(),
    ]);

    if (!user || !tenant) {
      throw Error("User or Tenant not found");
    }
    return { user, tenant };
  },
});
