import { getCurrentUser } from "@/features/auth/auth.api";
import { ensureValidSession } from "@/features/auth/get-session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_customer")({
  beforeLoad: async () => {
    const { accessToken } = await ensureValidSession();
    return { accessToken };
  },
  loader: async () => {
    const user = await getCurrentUser();

    if (!user) {
      throw Error("User or  not found");
    }

    return { user };
  },
});
