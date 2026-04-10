import { z } from "zod";

export const authRedirectTargetSchema = z.object({
	to: z.string(),
	search: z.record(z.string(), z.string()).optional(),
});

export type AuthRedirectTarget = z.infer<typeof authRedirectTargetSchema>;

export function normalizeAuthRedirectTarget(
	redirectTo: AuthRedirectTarget | string,
): AuthRedirectTarget {
	return typeof redirectTo === "string" ? { to: redirectTo } : redirectTo;
}
