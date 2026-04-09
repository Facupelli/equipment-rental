import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { refreshSession } from "./refresh-session";
import { getAppSession } from "@/lib/session";

// How many milliseconds before expiry we proactively refresh.
const REFRESH_BUFFER_MS = 30 * 1000; // 30 seconds

// ── ensureValidSession ────────────────────────────────────────────────────────
// The single auth entry point for all protected routes.
// Called once in beforeLoad on each protected layout route (_admin, _portal).
//
// Responsibilities:
//   1. Verify a session exists
//   2. Proactively refresh if the access token is expiring soon
//   3. Return the fresh access token for use in route context
//
// All child server functions trust that beforeLoad already guaranteed a valid
// session — they just read it directly via getAppSession() or apiFetch().

export const ensureValidSession = createServerFn({ method: "GET" })
	.inputValidator((redirectTo: string) => redirectTo)
	.handler(async ({ data: redirectTo }) => {
		const session = await getAppSession();
		const { accessToken, refreshToken, accessTokenExpiresAt } =
			session.data ?? {};

		if (!accessToken || !refreshToken) {
			throw redirect({ to: redirectTo });
		}

		const expiresAt = accessTokenExpiresAt ?? 0;
		const isExpiringSoon = expiresAt - Date.now() < REFRESH_BUFFER_MS;

		if (isExpiringSoon) {
			await refreshSession(redirectTo);
		}

		// Re-read after potential refresh so the returned token is always fresh.
		const freshSession = await getAppSession();

		return {
			accessToken: freshSession.data.accessToken,
		};
	});
