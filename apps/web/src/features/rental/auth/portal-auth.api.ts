import {
	customerGoogleAuthStateResponseSchema,
	exchangeCustomerGoogleHandoffResponseSchema,
	exchangeCustomerGoogleHandoffSchema,
	issueCustomerGoogleAuthStateSchema,
	loginCustomerSchema,
	registerCustomerSchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { writeSessionFromTokens } from "@/features/auth/auth-session.server";
import type { LoginResponseDto } from "@/features/auth/schemas/login-form.schema";
import { portalTenantMiddleware } from "@/features/tenant-context/portal-tenant.middleware";
import { apiFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/session";
import { getAppSession } from "@/lib/session.server";
import type { LoginCustomerInput } from "./login/customer-login-form.schema";
import type { RegisterCustomerInput } from "./register/customer-register-form.schema";

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

export const createGoogleCustomerStateFn = createServerFn({ method: "POST" })
	.middleware([portalTenantMiddleware])
	.inputValidator(
		(data: { tenantId: string; portalOrigin: string; redirectPath: string }) =>
			issueCustomerGoogleAuthStateSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const response = await apiFetch("/auth/customer/google/state", {
			method: "POST",
			body: data,
		});

		return customerGoogleAuthStateResponseSchema.parse(response);
	});

export const loginCustomerWithGoogleHandoffFn = createServerFn({
	method: "POST",
})
	.middleware([portalTenantMiddleware])
	.inputValidator((data: { handoffToken: string }) =>
		exchangeCustomerGoogleHandoffSchema.parse(data),
	)
	.handler(async ({ data }): Promise<SessionUser> => {
		const response = exchangeCustomerGoogleHandoffResponseSchema.parse(
			await apiFetch("/auth/customer/google/handoff", {
				method: "POST",
				body: data,
			}),
		);

		const session = await getAppSession();

		return writeSessionFromTokens(session, {
			accessToken: response.access_token,
			refreshToken: response.refresh_token,
		});
	});
