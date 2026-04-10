import { z } from "zod";

export const PORTAL_AUTH_REDIRECT_ROUTES = [
  "/rental",
  "/cart",
  "/onboard",
] as const;

export const portalAuthRedirectSchema = z.object({
  redirectTo: z.enum(PORTAL_AUTH_REDIRECT_ROUTES).catch("/rental").optional(),
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

  if (search.redirectTo === "/onboard") {
    return { to: "/onboard" as const };
  }

  return { to: "/rental" as const };
}
