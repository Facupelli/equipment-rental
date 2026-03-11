import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { useAppSession } from "@/lib/session";
import {
  loginCustomerSchema,
  registerCustomerSchema,
  type LoginCustomerDto,
  type RegisterCustomerDto,
} from "@repo/schemas";
import { type LoginResponseDto } from "@/features/auth/schemas/login-form.schema";
import { ACCESS_TOKEN_TTL_MS } from "@/features/auth/auth.constants";

export const registerCustomer = createServerFn({ method: "POST" })
  .inputValidator((data: RegisterCustomerDto) =>
    registerCustomerSchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>("/auth/customer/register", {
      method: "POST",
      body: data,
      authenticated: false,
    });

    return result;
  });

export const loginCustomer = createServerFn({ method: "POST" })
  .inputValidator((data: LoginCustomerDto) => loginCustomerSchema.parse(data))
  .handler(async ({ data }): Promise<{ success: true }> => {
    const result = await apiFetch<LoginResponseDto>("/auth/customer/login", {
      method: "POST",
      body: data,
      authenticated: false,
    });

    console.log("login customer");

    const session = await useAppSession();
    await session.update({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    });

    return { success: true };
  });
