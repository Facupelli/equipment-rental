import { createServerFn } from "@tanstack/react-start";
import {
  type CreateTenantUserDto,
  type MeResponseDto,
  type RegisterResponseDto,
  createTenantUserSchema,
} from "@repo/schemas";
import { apiFetch, type ApiResult } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import {
  loginSchema,
  type LoginDto,
  type LoginResponseDto,
} from "./auth.schema";

export const registerTenantUser = createServerFn({ method: "POST" })
  .inputValidator((data: CreateTenantUserDto) =>
    createTenantUserSchema.parse(data),
  )
  .handler(async ({ data }): Promise<ApiResult<RegisterResponseDto>> => {
    const result = await apiFetch<RegisterResponseDto>("/tenancy/register", {
      method: "POST",
      body: data,
      authenticated: false,
    });

    return result;
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((data: LoginDto) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<ApiResult<null>> => {
    const result = await apiFetch<LoginResponseDto>("/auth/login", {
      method: "POST",
      body: data,
      authenticated: false,
    });

    if (result.success) {
      const session = await useAppSession();
      await session.update({
        accessToken: result.data.access_token,
        // userId: result.data.userId,
        // email: result.data.email,
      });
    }

    return { success: true, data: null };
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async (): Promise<void> => {
    const session = await useAppSession();
    await session.clear();
  },
);

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useAppSession();

    if (!session.data.accessToken) {
      return null;
    }

    const result = await apiFetch<MeResponseDto>("/users/me", {
      method: "GET",
      authenticated: true,
    });

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  },
);
