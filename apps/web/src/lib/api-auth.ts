import type { PaginatedDto } from "@repo/schemas";
import type { ActorType } from "@repo/types";
import { createServerOnlyFn } from "@tanstack/react-start";
import {
	normalizeAuthRedirectTarget,
	type AuthRedirectTarget,
} from "@/features/auth/auth-redirect";
import { requireSession } from "@/features/auth/guards.server";
import { refreshSession } from "@/features/auth/refresh.server";
import { ProblemDetailsError } from "@/shared/errors";
import { apiFetch, apiFetchPaginated, type ApiFetchOptions } from "./api";

type AuthenticatedApiFetchOptions = ApiFetchOptions & {
	redirectTo?: AuthRedirectTarget | string;
	actorType?: ActorType;
};

async function resolveAccessToken(
	redirectTo: AuthRedirectTarget,
	actorType?: ActorType,
): Promise<string> {
	const session = await requireSession({ redirectTo, actorType });

	return session.accessToken;
}

async function withSessionRetry<T>(
	request: (accessToken: string) => Promise<T>,
	redirectTo: AuthRedirectTarget,
	actorType?: ActorType,
): Promise<T> {
	let accessToken = await resolveAccessToken(redirectTo, actorType);
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
					accessToken = await resolveAccessToken(redirectTo, actorType);
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
		const {
			redirectTo = "/admin/login",
			actorType,
			...requestOptions
		} = options;

		return withSessionRetry(
			(accessToken) => apiFetch<T>(path, { ...requestOptions, accessToken }),
			normalizeAuthRedirectTarget(redirectTo),
			actorType,
		);
	},
);

export const authenticatedApiFetchPaginated = createServerOnlyFn(
	async <T>(
		path: string,
		options: AuthenticatedApiFetchOptions = {},
	): Promise<PaginatedDto<T>> => {
		const {
			redirectTo = "/admin/login",
			actorType,
			...requestOptions
		} = options;

		return withSessionRetry(
			(accessToken) =>
				apiFetchPaginated<T>(path, { ...requestOptions, accessToken }),
			normalizeAuthRedirectTarget(redirectTo),
			actorType,
		);
	},
);
