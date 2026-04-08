import { getAppSession } from "@/lib/session";
import { redirect } from "@tanstack/react-router";
import { ACCESS_TOKEN_TTL_MS } from "./auth.constants";

// ── Concurrency Lock ──────────────────────────────────────────────────────────
// If two server functions fire simultaneously and both receive a 401, both
// would attempt to refresh at the same time. The second call would hit the
// NestJS API with an already-rotated (now revoked) token, triggering reuse
// detection and nuking the entire session.
//
// This lock ensures only one refresh runs at a time. Any concurrent callers
// wait for the in-flight refresh to settle, then reuse its result.
//
// Note: this is an in-memory lock — correct for a single Node.js process.
// If you ever scale to multiple server instances, replace with a Redis lock.

let inflightRefresh: Promise<boolean> | null = null;

// ── refreshSession ────────────────────────────────────────────────────────────
// Attempts to exchange the stored refresh token for a new token pair.
// Returns true if the session was successfully refreshed, false otherwise.
// On an unrecoverable failure (no refresh token, API rejects it), clears the
// session and redirects the user to the login page.

export async function refreshSession(
	face: "admin" | "portal",
): Promise<boolean> {
	if (inflightRefresh) {
		return inflightRefresh;
	}

	inflightRefresh = attemptRefresh(face).finally(() => {
		inflightRefresh = null;
	});

	return inflightRefresh;
}

async function attemptRefresh(face: "admin" | "portal"): Promise<boolean> {
	const session = await getAppSession();
	const refreshToken = session.data.refreshToken;

	const loginRoute = face === "admin" ? "/admin/login" : "/login";

	if (!refreshToken) {
		await session.clear();
		throw redirect({ to: loginRoute });
	}

	let response: Response;

	try {
		response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				// NestJS RefreshTokenStrategy uses fromAuthHeaderAsBearerToken()
				Authorization: `Bearer ${refreshToken}`,
			},
		});
	} catch {
		// Network-level failure — don't clear the session, the user might be
		// temporarily offline. Caller decides how to handle the false return.
		return false;
	}

	if (!response.ok) {
		// API rejected the refresh token (expired, revoked, reuse detected).
		// Unrecoverable — clear session and force re-login.
		await session.clear();
		throw redirect({ to: loginRoute });
	}

	const body = (await response.json()) as {
		data: { access_token: string; refresh_token: string };
	};

	await session.update({
		...session.data,
		accessToken: body.data.access_token,
		refreshToken: body.data.refresh_token,
		accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
	});

	return true;
}
