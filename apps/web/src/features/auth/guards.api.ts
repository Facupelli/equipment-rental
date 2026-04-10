import { createServerFn } from "@tanstack/react-start";
import type { SessionUser } from "@/lib/session";
import { authRedirectTargetSchema } from "./auth-redirect";
import {
	getOptionalCustomerSession,
	requireAdminSession,
	requireCustomerSession,
} from "./guards.server";

const guardInputSchema = authRedirectTargetSchema.transform((redirectTo) => ({
	redirectTo,
}));

export const requireAdminSessionFn = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => guardInputSchema.parse(data))
	.handler(async ({ data }) => ({
		user: await requireAdminSession(data),
	}));

export const requireCustomerSessionFn = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => guardInputSchema.parse(data))
	.handler(async ({ data }) => ({
		user: await requireCustomerSession(data),
	}));

export const getOptionalCustomerSessionFn = createServerFn({
	method: "GET",
}).handler(
	async (): Promise<SessionUser | null> => getOptionalCustomerSession(),
);
