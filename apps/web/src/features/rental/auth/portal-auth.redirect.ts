import { z } from "zod";

export const PORTAL_AUTH_REDIRECT_ROUTES = ["/rental", "/cart"] as const;

export const portalAuthRedirectSchema = z.object({
	redirectTo: z.enum(PORTAL_AUTH_REDIRECT_ROUTES).catch("/rental"),
	locationId: z.string().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

export type PortalAuthRedirect = z.infer<typeof portalAuthRedirectSchema>;

export function getPortalAuthRedirectTarget(search: PortalAuthRedirect) {
	if (
		search.redirectTo === "/cart" &&
		search.locationId &&
		search.startDate &&
		search.endDate
	) {
		return {
			to: "/cart" as const,
			search: {
				locationId: search.locationId,
				startDate: search.startDate,
				endDate: search.endDate,
			},
		};
	}

	return { to: "/rental" as const };
}
