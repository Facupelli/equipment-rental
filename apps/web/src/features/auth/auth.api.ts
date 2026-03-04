import { createServerFn } from "@tanstack/react-start";
import {
  CreateTenantUserSchema,
  type CreaetTenantUserResponse,
  type MeResponseDto,
  type TenantUserCreate,
} from "@repo/schemas";
import { apiFetch } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import {
  loginSchema,
  type LoginDto,
  type LoginResponseDto,
} from "./auth.schema";
import { ACCESS_TOKEN_TTL_MS } from "./auth.constants";

export const registerTenantUser = createServerFn({ method: "POST" })
  .inputValidator((data: TenantUserCreate) =>
    CreateTenantUserSchema.parse(data),
  )
  .handler(async ({ data }): Promise<CreaetTenantUserResponse> => {
    const result = await apiFetch<CreaetTenantUserResponse>(
      "/tenants/register",
      {
        method: "POST",
        body: data,
        authenticated: false,
      },
    );

    console.log({ result });

    return result;
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((data: LoginDto) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<{ success: true }> => {
    const result = await apiFetch<LoginResponseDto>("/auth/login", {
      method: "POST",
      body: data,
      authenticated: false,
    });

    const session = await useAppSession();
    await session.update({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    });

    return { success: true };
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async (): Promise<void> => {
    const session = await useAppSession();
    await session.clear();
  },
);

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<MeResponseDto | null> => {
    const session = await useAppSession();

    if (!session.data.accessToken) {
      return null;
    }

    const result = await apiFetch<MeResponseDto>("/users/me", {
      method: "GET",
    });

    return result;
  },
);
