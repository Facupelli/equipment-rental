import { DepiqoLandingPage } from "@/features/marketing/pages/depiqo-landing";
import { tenantLandingRegistry } from "@/features/tenant-landings/tenant-landing-registry";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const { tenantContext } = Route.useRouteContext();

	if (tenantContext.face === "platform") {
		return <DepiqoLandingPage />;
	}

	if (tenantContext.face === "admin") {
		throw redirect({ to: "/dashboard" });
	}

	const LandingPage = tenantLandingRegistry[tenantContext.tenant.slug];

	if (!LandingPage) {
		throw notFound();
	}

	return <LandingPage />;
}
