import { redirect } from "@tanstack/react-router";
import { getAppSession } from "@/lib/session.server";
import type { AuthRedirectTarget } from "./auth-redirect";
import { writeSessionFromTokens } from "./session.server";

const inflightRefreshes = new Map<string, Promise<boolean>>();

export async function refreshSession(
	redirectTo: AuthRedirectTarget,
): Promise<boolean> {
	const session = await getAppSession();
	const refreshToken = session.data.refreshToken;

	if (!refreshToken) {
		await session.clear();
		throw redirect(redirectTo);
	}

	const inflightRefresh = inflightRefreshes.get(refreshToken);

	if (inflightRefresh) {
		return inflightRefresh;
	}

	const refreshPromise = attemptRefresh(redirectTo, refreshToken).finally(
		() => {
			inflightRefreshes.delete(refreshToken);
		},
	);

	inflightRefreshes.set(refreshToken, refreshPromise);

	return refreshPromise;
}

async function attemptRefresh(
	redirectTo: AuthRedirectTarget,
	refreshToken: string,
): Promise<boolean> {
	const session = await getAppSession();

	if (session.data.refreshToken !== refreshToken) {
		return true;
	}

	if (!session.data.refreshToken) {
		await session.clear();
		throw redirect(redirectTo);
	}

	let response: Response;

	try {
		response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${refreshToken}`,
			},
		});
	} catch {
		return false;
	}

	if (!response.ok) {
		await session.clear();
		throw redirect(redirectTo);
	}

	const body = (await response.json()) as {
		data: { access_token: string; refresh_token: string };
	};

	await writeSessionFromTokens(session, {
		accessToken: body.data.access_token,
		refreshToken: body.data.refresh_token,
	});

	return true;
}
