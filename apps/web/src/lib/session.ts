import type { ActorType } from "@repo/types";

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
	 * Derived from the access token exp claim on login and refresh.
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

type JwtPayload = {
	exp?: number;
};

export function getTokenExpirationTimestamp(token: string): number {
	const payload = JSON.parse(
		Buffer.from(token.split(".")[1], "base64url").toString("utf-8"),
	) as JwtPayload;

	if (typeof payload.exp !== "number") {
		throw new Error("Access token is missing exp claim");
	}

	return payload.exp * 1000;
}

export function hasActiveSession(
	data: Partial<SessionData> | undefined,
): data is SessionData {
	return Boolean(
		data?.userId &&
			data.email &&
			data.tenantId &&
			data.actorType &&
			data.accessToken &&
			data.refreshToken &&
			typeof data.accessTokenExpiresAt === "number",
	);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a full SessionData into the safe SessionUser shape.
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
