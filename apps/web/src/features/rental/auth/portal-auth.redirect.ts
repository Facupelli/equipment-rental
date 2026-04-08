import { z } from "zod";

export const PORTAL_AUTH_REDIRECT_ROUTES = ["/rental", "/cart"] as const;

export const portalAuthRedirectSchema = z.object({
	redirectTo: z.enum(PORTAL_AUTH_REDIRECT_ROUTES).catch("/rental"),
	locationId: z.string().optional(),
	pickupDate: z.iso.date().optional(),
	returnDate: z.iso.date().optional(),
});

export type PortalAuthRedirect = z.infer<typeof portalAuthRedirectSchema>;

export function getPortalAuthRedirectTarget(search: PortalAuthRedirect) {
	if (
		search.redirectTo === "/cart" &&
		search.locationId &&
		search.pickupDate &&
		search.returnDate
	) {
		return {
			to: "/cart" as const,
			search: {
				locationId: search.locationId,
				pickupDate: search.pickupDate,
				returnDate: search.returnDate,
			},
		};
	}

	return { to: "/rental" as const };
}
