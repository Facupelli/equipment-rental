import type { PaginatedDto } from "@repo/schemas";
import { createServerOnlyFn } from "@tanstack/react-start";
import { refreshSession } from "@/features/auth/refresh-session";
import { ProblemDetailsError } from "@/shared/errors";
import { apiFetch, apiFetchPaginated, type ApiFetchOptions } from "./api";
import { getAppSession } from "./session";

type AuthenticatedApiFetchOptions = ApiFetchOptions & {
	redirectTo?: string;
};

async function resolveAccessToken(): Promise<string> {
	const session = await getAppSession();
	const accessToken = session.data.accessToken;

	if (!accessToken) {
		throw new ProblemDetailsError({
			type: "about:blank",
			title: "Unauthorized",
			status: 401,
			detail: "No active session. Please log in.",
		});
	}

	return accessToken;
}

async function withSessionRetry<T>(
	request: (accessToken: string) => Promise<T>,
	redirectTo: string,
): Promise<T> {
	let accessToken = await resolveAccessToken();
	let hasRetried = false;

	while (true) {
		try {
			return await request(accessToken);
		} catch (error) {
			if (
				error instanceof ProblemDetailsError &&
				error.problemDetails.status === 401 &&
				!hasRetried
			) {
				const refreshed = await refreshSession(redirectTo);

				if (refreshed) {
					accessToken = await resolveAccessToken();
					hasRetried = true;
					continue;
				}
			}

			throw error;
		}
	}
}

export const authenticatedApiFetch = createServerOnlyFn(
	async <T>(
		path: string,
		options: AuthenticatedApiFetchOptions = {},
	): Promise<T> => {
		const { redirectTo = "/admin/login", ...requestOptions } = options;

		return withSessionRetry(
			(accessToken) => apiFetch<T>(path, { ...requestOptions, accessToken }),
			redirectTo,
		);
	},
);

export const authenticatedApiFetchPaginated = createServerOnlyFn(
	async <T>(
		path: string,
		options: AuthenticatedApiFetchOptions = {},
	): Promise<PaginatedDto<T>> => {
		const { redirectTo = "/admin/login", ...requestOptions } = options;

		return withSessionRetry(
			(accessToken) =>
				apiFetchPaginated<T>(path, { ...requestOptions, accessToken }),
			redirectTo,
		);
	},
);
