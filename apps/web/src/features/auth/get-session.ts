import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { refreshSession } from "./refresh-session";
import { useAppSession } from "@/lib/session";

// How many milliseconds before expiry we proactively refresh.
const REFRESH_BUFFER_MS = 30 * 1000; // 30 seconds

// ── ensureValidSession ────────────────────────────────────────────────────────
// The single auth entry point for all protected routes.
// Called once in beforeLoad on the _authed layout route.
//
// Responsibilities:
//   1. Verify a session exists
//   2. Proactively refresh if the access token is expiring soon
//   3. Return the fresh access token for use in route context
//
// All child server functions trust that beforeLoad already guaranteed a valid
// session — they just read it directly via useAppSession() or apiFetch().

export const ensureValidSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useAppSession();
    const { accessToken, refreshToken, accessTokenExpiresAt } = session.data;

    if (!accessToken || !refreshToken) {
      throw redirect({ to: "/login" });
    }

    const expiresAt = accessTokenExpiresAt ?? 0;
    const isExpiringSoon = expiresAt - Date.now() < REFRESH_BUFFER_MS;

    if (isExpiringSoon) {
      console.log({ isExpiringSoon }, "REFRESH SESSION");
      // refreshSession() updates the session in place.
      // On unrecoverable failure it throws redirect({ to: '/login' }) itself.
      await refreshSession();
    }

    // Re-read session to get the potentially refreshed token.
    const freshSession = await useAppSession();

    return {
      accessToken: freshSession.data.accessToken!,
    };
  },
);
