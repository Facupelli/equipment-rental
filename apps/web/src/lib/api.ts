import type { PaginatedDto } from "@repo/schemas";
import { refreshSession } from "@/features/auth/refresh-session";
import { ProblemDetailsError } from "@/shared/errors";
import { getAppSession } from "./session";
import {
	apiFetchRaw as coreApiFetchRaw,
	type ApiRequestOptions,
} from "./api-core";

type ApiAuthOptions = false | { redirectTo: string };

type ApiFetchOptions = ApiRequestOptions & {
	auth?: ApiAuthOptions;
};

// ── apiFetchRaw ───────────────────────────────────────────────────────────────
// This function retains a reactive 401 fallback as a safety net for edge cases:
// revoked tokens, clock skew, or any request that somehow bypasses beforeLoad.
//
// The loop runs at most twice:
//   Attempt 1: use current token from session
//   On 401:    call refreshSession() once → attempt 2 with fresh token
//   Attempt 2: if 401 again, surface the error — something is genuinely wrong

async function apiFetchRaw<T>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	const { auth, ...requestOptions } = options;
	const requiresAuth = auth !== false;
	const redirectTo =
		auth === false ? undefined : (auth?.redirectTo ?? "/admin/login");

	let currentToken: string | undefined;
	let hasRetried = false;

	while (true) {
		const authHeader: Record<string, string> = {};

		if (requiresAuth) {
			if (!currentToken) {
				const session = await getAppSession();
				currentToken = session.data.accessToken;
			}

			if (!currentToken) {
				throw new ProblemDetailsError({
					type: "about:blank",
					title: "Unauthorized",
					status: 401,
					detail: "No active session. Please log in.",
				});
			}

			authHeader.Authorization = `Bearer ${currentToken}`;
		}

		let result: T;

		try {
			result = await coreApiFetchRaw<T>(path, {
				...requestOptions,
				headers: {
					...authHeader,
					...requestOptions.headers,
				},
			});
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				if (
					error.problemDetails.status === 401 &&
					requiresAuth &&
					!hasRetried
				) {
					const refreshed = await refreshSession(redirectTo ?? "/admin/login");

					if (refreshed) {
						currentToken = undefined;
						hasRetried = true;
						continue;
					}
				}
			}

			throw error;
		}

		return result;
	}
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function apiFetch<T>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	const body = await apiFetchRaw<{ data: T }>(path, options);
	return body?.data;
}

export async function apiFetchPaginated<T>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<PaginatedDto<T>> {
	const body = await apiFetchRaw<PaginatedDto<T>>(path, options);
	return body;
}
