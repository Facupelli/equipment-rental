import { getCurrentUser } from "@/features/auth/auth.api";
import { getCurrentTenant } from "@/features/tenancy/tenancy.api";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const [user, tenant] = await Promise.all([
      getCurrentUser(),
      getCurrentTenant(),
    ]);

    if (!user || !tenant) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    // Pass user to child routes
    return { user, tenant };
  },
});
