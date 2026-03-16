import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { getAppSession, toSessionUser, type SessionUser } from "@/lib/session";
import {
  loginCustomerSchema,
  registerCustomerSchema,
  type LoginCustomerDto,
  type RegisterCustomerDto,
} from "@repo/schemas";
import { type LoginResponseDto } from "@/features/auth/schemas/login-form.schema";
import { writeSession } from "@/features/auth/auth.api";
import type { ActorType } from "@repo/types";

export const registerCustomerFn = createServerFn({ method: "POST" })
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

export const loginCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((data: LoginCustomerDto) => loginCustomerSchema.parse(data))
  .handler(async ({ data }): Promise<SessionUser> => {
    const response = await apiFetch<LoginResponseDto>("/auth/customer/login", {
      method: "POST",
      body: data,
      authenticated: false,
    });

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
