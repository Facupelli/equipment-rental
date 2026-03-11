import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { refreshSession } from "./refresh-session";
import { useAppSession } from "@/lib/session";

// How many milliseconds before expiry we proactively refresh.
const REFRESH_BUFFER_MS = 30 * 1000; // 30 seconds

// ── ensureValidSession ────────────────────────────────────────────────────────
// The single auth entry point for all protected routes.
// Called once in beforeLoad on the _admin/dashboard layout route.
//
// Responsibilities:
//   1. Verify a session exists
//   2. Proactively refresh if the access token is expiring soon
//   3. Return the fresh access token for use in route context
//
// All child server functions trust that beforeLoad already guaranteed a valid
// session — they just read it directly via useAppSession() or apiFetch().

export const ensureValidSession = createServerFn({ method: "GET" })
  .inputValidator((face: "admin" | "portal") => face)
  .handler(async ({ data: face }) => {
    const session = await useAppSession();
    const { accessToken, refreshToken, accessTokenExpiresAt } = session.data;

    const loginRoute = face === "admin" ? "/admin/login" : "/login";

    if (!accessToken || !refreshToken) {
      throw redirect({ to: loginRoute });
    }

    const expiresAt = accessTokenExpiresAt ?? 0;
    const isExpiringSoon = expiresAt - Date.now() < REFRESH_BUFFER_MS;

    if (isExpiringSoon) {
      await refreshSession(face); // refreshSession needs the same treatment
    }

    const freshSession = await useAppSession();

    return {
      accessToken: freshSession.data.accessToken!,
    };
  });
