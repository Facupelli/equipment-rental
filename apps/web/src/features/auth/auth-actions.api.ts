import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { authenticatedApiFetch } from "@/lib/api-auth";
import { getAppSession } from "@/lib/session.server";
import {
	loginSchema,
	type LoginDto,
	type LoginResponseDto,
} from "./schemas/login-form.schema";
import {
	registerSchema,
	type RegisterDto,
	type RegisterResponse,
} from "@repo/schemas";
import type { SessionUser } from "@/lib/session";
import { getOptionalSessionUser } from "./auth-guards.server";
import { writeSessionFromTokens } from "./auth-session.server";

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const registerTenantUserFn = createServerFn({ method: "POST" })
	.inputValidator((data: RegisterDto) => registerSchema.parse(data))
	.handler(async ({ data }): Promise<RegisterResponse> => {
		const result = await apiFetch<RegisterResponse>("/tenants/register", {
			method: "POST",
			body: data,
		});

		return result;
	});

export const loginUserFn = createServerFn({ method: "POST" })
	.inputValidator((data: LoginDto) => loginSchema.parse(data))
	.handler(async ({ data }): Promise<SessionUser> => {
		const response = await apiFetch<LoginResponseDto>("/auth/login", {
			method: "POST",
			body: data,
		});

		const session = await getAppSession();

		return writeSessionFromTokens(session, {
			accessToken: response.access_token,
			refreshToken: response.refresh_token,
		});
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(
	async (): Promise<void> => {
		const session = await getAppSession();

		if (!session.data?.accessToken) {
			await session.clear();
			return;
		}

		try {
			await authenticatedApiFetch(`/auth/logout`, {
				method: "POST",
			});
		} catch (err) {
			console.error("[logoutFn] NestJS logout call failed:", err);
		} finally {
			await session.clear();
		}
	},
);

/**
 * Returns the current session user (safe fields only) or null if not
 * authenticated. Called from route guards and the useAuth hook.
 */
export const getSessionUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<SessionUser | null> => {
		return getOptionalSessionUser();
	},
);
