import type { ActorType } from "@repo/types";
import { useSession } from "@tanstack/react-start/server";

/**
 * Data stored inside the encrypted session cookie.
 * Tokens never leave this server-side envelope — the browser only ever
 * receives the safe SessionUser shape returned by server functions.
 */
export interface SessionData {
	userId: string;
	email: string;
	tenantId: string;
	actorType: ActorType;
	accessToken: string;
	refreshToken: string;
	/**
	 * Unix timestamp in milliseconds of when the access token expires.
	 * Set as Date.now() + ACCESS_TOKEN_TTL_MS on login and refresh.
	 */
	accessTokenExpiresAt: number;
}

/**
 * The safe subset of session data that is returned to the client.
 * Contains no tokens, no expiry internals.
 */
export interface SessionUser {
	userId: string;
	email: string;
	tenantId: string;
	actorType: ActorType;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type AppSession = Awaited<ReturnType<typeof useSession<SessionData>>>;

/**
 * Central session accessor. Import and call this inside any server function
 * that needs to read or write auth state.
 *
 * The cookie is HttpOnly, Secure, and SameSite=Lax — the browser can store
 * and transmit it but cannot read its contents. The payload is AES-GCM
 * encrypted by TanStack Start using SESSION_SECRET.
 */
export function getAppSession(): Promise<AppSession> {
	return useSession<SessionData>({
		name: "app_session",
		password: process.env.SESSION_SECRET!,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			// Align with your JWT_REFRESH_EXPIRATION_TIME_SECONDS.
			maxAge: 60 * 60 * 24 * 7, // 7 days
		},
	});
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a full SessionData into the safe SessionUser shape
 * that is safe to send to the browser.
 */
export function toSessionUser(data: Partial<SessionData>): SessionUser {
	if (!data.userId || !data.email || !data.tenantId || !data.actorType) {
		throw new Error("Session data is incomplete");
	}

	return {
		userId: data.userId,
		email: data.email,
		tenantId: data.tenantId,
		actorType: data.actorType,
	};
}
