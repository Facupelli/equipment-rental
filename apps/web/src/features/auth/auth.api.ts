import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import {
  loginSchema,
  type LoginDto,
  type LoginResponseDto,
} from "./schemas/login-form.schema";
import { ACCESS_TOKEN_TTL_MS } from "./auth.constants";
import {
  registerSchema,
  type MeResponse,
  type RegisterDto,
  type RegisterResponse,
} from "@repo/schemas";

export const registerTenantUser = createServerFn({ method: "POST" })
  .inputValidator((data: RegisterDto) => registerSchema.parse(data))
  .handler(async ({ data }): Promise<RegisterResponse> => {
    const result = await apiFetch<RegisterResponse>("/tenants/register", {
      method: "POST",
      body: data,
      authenticated: false,
    });

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
  async (): Promise<MeResponse | null> => {
    const session = await useAppSession();

    if (!session.data.accessToken) {
      return null;
    }

    const result = await apiFetch<MeResponse>("/users/me", {
      method: "GET",
    });

    return result;
  },
);
