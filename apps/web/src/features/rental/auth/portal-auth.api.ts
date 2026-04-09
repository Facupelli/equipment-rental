import { loginCustomerSchema, registerCustomerSchema } from "@repo/schemas";
import type { ActorType } from "@repo/types";
import { createServerFn } from "@tanstack/react-start";
import { writeSession } from "@/features/auth/auth.api";
import type { LoginResponseDto } from "@/features/auth/schemas/login-form.schema";
import { resolveTenantContextServer } from "@/features/tenant-context/resolve-tenant-context";
import { apiFetch } from "@/lib/api";
import { getAppSession, type SessionUser, toSessionUser } from "@/lib/session";
import type { LoginCustomerInput } from "./login/customer-login-form.schema";
import type { RegisterCustomerInput } from "./register/customer-register-form.schema";

async function getPortalTenantId(): Promise<string> {
	const tenantContext = await resolveTenantContextServer();

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
			authenticated: false,
			face: "portal",
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
			authenticated: false,
			face: "portal",
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
