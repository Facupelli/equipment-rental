import { loginCustomerSchema, registerCustomerSchema } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import type { LoginResponseDto } from "@/features/auth/schemas/login-form.schema";
import { portalTenantMiddleware } from "@/features/tenant-context/portal-tenant.middleware";
import { apiFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/session";
import { getAppSession } from "@/lib/session.server";
import type { LoginCustomerInput } from "./login/customer-login-form.schema";
import type { RegisterCustomerInput } from "./register/customer-register-form.schema";
import { writeSessionFromTokens } from "@/features/auth/auth-session.server";

export const registerCustomerFn = createServerFn({ method: "POST" })
	.middleware([portalTenantMiddleware])
	.inputValidator((data: RegisterCustomerInput) => data)
	.handler(async ({ context, data }): Promise<string> => {
		const dto = registerCustomerSchema.parse({
			...data,
			tenantId: context.tenantId,
		});

		const result = await apiFetch<string>("/auth/customer/register", {
			method: "POST",
			body: dto,
		});

		return result;
	});

export const loginCustomerFn = createServerFn({ method: "POST" })
	.middleware([portalTenantMiddleware])
	.inputValidator((data: LoginCustomerInput) => data)
	.handler(async ({ context, data }): Promise<SessionUser> => {
		const dto = loginCustomerSchema.parse({
			...data,
			tenantId: context.tenantId,
		});

		const response = await apiFetch<LoginResponseDto>("/auth/customer/login", {
			method: "POST",
			body: dto,
		});

		const session = await getAppSession();

		return writeSessionFromTokens(session, {
			accessToken: response.access_token,
			refreshToken: response.refresh_token,
		});
	});
