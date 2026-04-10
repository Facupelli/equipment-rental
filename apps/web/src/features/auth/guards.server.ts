import { ActorType } from "@repo/types";
import { redirect } from "@tanstack/react-router";
import { getAppSession } from "@/lib/session.server";
import {
	hasActiveSession,
	toSessionUser,
	type SessionData,
	type SessionUser,
} from "@/lib/session";
import type { AuthRedirectTarget } from "./auth-redirect";
import { refreshSession } from "./refresh.server";

const REFRESH_BUFFER_MS = 30 * 1000;

type RequireSessionOptions = {
	redirectTo: AuthRedirectTarget;
	actorType?: ActorType;
};

function isAccessTokenExpiring(expiresAt: number): boolean {
	return expiresAt - Date.now() < REFRESH_BUFFER_MS;
}

async function clearSessionAndRedirect(
	redirectTo: AuthRedirectTarget,
): Promise<never> {
	const session = await getAppSession();
	await session.clear();
	throw redirect(redirectTo);
}

async function readRequiredSession(
	options: RequireSessionOptions,
): Promise<SessionData> {
	const session = await getAppSession();

	if (!hasActiveSession(session.data)) {
		return clearSessionAndRedirect(options.redirectTo);
	}

	if (options.actorType && session.data.actorType !== options.actorType) {
		return clearSessionAndRedirect(options.redirectTo);
	}

	return session.data;
}

export async function getOptionalSessionUser(): Promise<SessionUser | null> {
	const session = await getAppSession();

	if (!hasActiveSession(session.data)) {
		return null;
	}

	return toSessionUser(session.data);
}

export async function getOptionalCustomerSession(): Promise<SessionUser | null> {
	const session = await getAppSession();

	if (!hasActiveSession(session.data)) {
		return null;
	}

	if (session.data.actorType !== ActorType.CUSTOMER) {
		await session.clear();
		return null;
	}

	if (!isAccessTokenExpiring(session.data.accessTokenExpiresAt)) {
		return toSessionUser(session.data);
	}

	const refreshed = await refreshSession({ to: "/login" }).catch(async () => {
		await session.clear();
		return false;
	});

	if (!refreshed) {
		const latestSession = await getAppSession();

		if (!hasActiveSession(latestSession.data)) {
			return null;
		}

		if (
			latestSession.data.actorType !== ActorType.CUSTOMER ||
			latestSession.data.accessTokenExpiresAt <= Date.now()
		) {
			await latestSession.clear();
			return null;
		}

		return toSessionUser(latestSession.data);
	}

	const latestSession = await getAppSession();

	if (!hasActiveSession(latestSession.data)) {
		return null;
	}

	if (latestSession.data.actorType !== ActorType.CUSTOMER) {
		await latestSession.clear();
		return null;
	}

	return toSessionUser(latestSession.data);
}

export async function requireSession(
	options: RequireSessionOptions,
): Promise<SessionData> {
	let session = await readRequiredSession(options);

	if (!isAccessTokenExpiring(session.accessTokenExpiresAt)) {
		return session;
	}

	const refreshed = await refreshSession(options.redirectTo);

	if (!refreshed) {
		session = await readRequiredSession(options);

		if (session.accessTokenExpiresAt <= Date.now()) {
			return clearSessionAndRedirect(options.redirectTo);
		}

		return session;
	}

	return readRequiredSession(options);
}

export async function requireAdminSession(options: {
	redirectTo: AuthRedirectTarget;
}): Promise<SessionUser> {
	const session = await requireSession({
		redirectTo: options.redirectTo,
		actorType: ActorType.USER,
	});

	return toSessionUser(session);
}

export async function requireCustomerSession(options: {
	redirectTo: AuthRedirectTarget;
}): Promise<SessionUser> {
	const session = await requireSession({
		redirectTo: options.redirectTo,
		actorType: ActorType.CUSTOMER,
	});

	return toSessionUser(session);
}
