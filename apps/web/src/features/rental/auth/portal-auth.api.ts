import { loginCustomerSchema, registerCustomerSchema } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import type { LoginResponseDto } from "@/features/auth/schemas/login-form.schema";
import { resolveTenantContextByHostname } from "@/features/tenant-context/tenant-context.service";
import { apiFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/session";
import { getAppSession } from "@/lib/session.server";
import type { LoginCustomerInput } from "./login/customer-login-form.schema";
import type { RegisterCustomerInput } from "./register/customer-register-form.schema";
import { writeSessionFromTokens } from "@/features/auth/auth-session.server";

async function getPortalTenantId(): Promise<string> {
	const tenantContext = await resolveTenantContextByHostname();

	if (tenantContext.face !== "portal") {
		throw new Error(
			"Portal customer auth is only available on tenant portal domains.",
		);
	}

	return tenantContext.tenant.id;
}

export const registerCustomerFn = createServerFn({ method: "POST" })
	.inputValidator((data: RegisterCustomerInput) => data)
	.handler(async ({ data }): Promise<string> => {
		const tenantId = await getPortalTenantId();
		const dto = registerCustomerSchema.parse({
			...data,
			tenantId,
		});

		const result = await apiFetch<string>("/auth/customer/register", {
			method: "POST",
			body: dto,
		});

		return result;
	});

export const loginCustomerFn = createServerFn({ method: "POST" })
	.inputValidator((data: LoginCustomerInput) => data)
	.handler(async ({ data }): Promise<SessionUser> => {
		const tenantId = await getPortalTenantId();
		const dto = loginCustomerSchema.parse({
			...data,
			tenantId,
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
