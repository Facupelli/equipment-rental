import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import {
  loginSchema,
  type LoginDto,
  type LoginResponseDto,
} from "./schemas/login-form.schema";
import { ACCESS_TOKEN_TTL_MS } from "./auth.constants";
import {
  registerSchema,
  type RegisterDto,
  type RegisterResponse,
} from "@repo/schemas";
import type { ActorType } from "@repo/types";
import {
  getAppSession,
  toSessionUser,
  type AppSession,
  type SessionData,
  type SessionUser,
} from "@/lib/session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Writes a fresh token pair into the session.
 * Called after login. The actorType and user claims come from the JWT payload
 * decoded immediately after NestJS issues it (safe — implicit trust on 200).
 */
export async function writeSession(
  session: AppSession,
  actor: {
    userId: string;
    email: string;
    tenantId: string;
    actorType: ActorType;
  },
  tokens: { accessToken: string; refreshToken: string },
): Promise<void> {
  await session.update((_data: Partial<SessionData>) => ({
    userId: actor.userId,
    email: actor.email,
    tenantId: actor.tenantId,
    actorType: actor.actorType,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    // Use the constant rather than decoding the JWT exp claim — simpler and
    // consistent with how refreshSession sets the same field.
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  }));
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const registerTenantUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: RegisterDto) => registerSchema.parse(data))
  .handler(async ({ data }): Promise<RegisterResponse> => {
    const result = await apiFetch<RegisterResponse>("/tenants/register", {
      method: "POST",
      body: data,
      auth: false,
    });

    return result;
  });

export const loginUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: LoginDto) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<SessionUser> => {
    const response = await apiFetch<LoginResponseDto>("/auth/login", {
      method: "POST",
      body: data,
      auth: false,
    });

    // Decode the JWT payload to extract the claims NestJS embedded.
    // No signature verification needed — we just called NestJS and got 200.
    const jwtPayload = JSON.parse(
      Buffer.from(response.access_token.split(".")[1], "base64url").toString(
        "utf-8",
      ),
    ) as {
      sub: string;
      email: string;
      tenantId: string;
      actorType: ActorType;
    };

    const session = await getAppSession();
    await writeSession(
      session,
      {
        userId: jwtPayload.sub,
        email: jwtPayload.email,
        tenantId: jwtPayload.tenantId,
        actorType: jwtPayload.actorType,
      },
      {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      },
    );

    return toSessionUser(session.data);
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<void> => {
    const session = await getAppSession();

    if (!session.data?.accessToken) {
      return;
    }

    try {
      await apiFetch(`/auth/logout`, {
        method: "POST",
      });
    } catch (err) {
      console.error("[logoutFn] NestJS logout call failed:", err);
    } finally {
      await session.clear();
    }

    await session.clear();
  },
);

/**
 * Returns the current session user (safe fields only) or null if not
 * authenticated. Called from route guards and the useAuth hook.
 */
export const getSessionUserFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await getAppSession();

    if (!session.data?.accessToken) {
      return null;
    }

    return toSessionUser(session.data);
  },
);
