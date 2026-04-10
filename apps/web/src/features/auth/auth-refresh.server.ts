import { getAppSession } from "@/lib/session.server";
import { AuthRequiredError, SessionExpiredError } from "@/shared/errors";
import { writeSessionFromTokens } from "./auth-session.server";

const inflightRefreshes = new Map<string, Promise<boolean>>();

export async function refreshSession(): Promise<boolean> {
	const session = await getAppSession();
	const refreshToken = session.data.refreshToken;

	if (!refreshToken) {
		await session.clear();
		throw new AuthRequiredError();
	}

	const inflightRefresh = inflightRefreshes.get(refreshToken);

	if (inflightRefresh) {
		return inflightRefresh;
	}

	const refreshPromise = attemptRefresh(refreshToken).finally(() => {
		inflightRefreshes.delete(refreshToken);
	});

	inflightRefreshes.set(refreshToken, refreshPromise);

	return refreshPromise;
}

async function attemptRefresh(refreshToken: string): Promise<boolean> {
	const session = await getAppSession();

	if (session.data.refreshToken !== refreshToken) {
		return true;
	}

	if (!session.data.refreshToken) {
		await session.clear();
		throw new AuthRequiredError();
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
		throw new SessionExpiredError();
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
