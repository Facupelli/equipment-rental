import { DepiqoLandingPage } from "@/features/marketing/pages/depiqo-landing";
import { tenantLandingRegistry } from "@/features/tenant-landings/tenant-landing-registry";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

const platformSeo = {
	title: "Depiqo | Software para alquiler de equipos",
	description:
		"Gestiona catalogo, reservas, clientes y operaciones para tu negocio de alquiler de equipos desde una sola plataforma.",
	ogTitle: "Depiqo | Software para rental de equipos",
	ogDescription:
		"Una plataforma para gestionar alquiler de equipos, disponibilidad, pedidos y clientes con una experiencia moderna.",
};

export const Route = createFileRoute("/")({
	loader: ({ context: { tenantContext } }) => {
		if (tenantContext.face === "platform") {
			return { seo: platformSeo };
		}

		if (tenantContext.face === "admin") {
			return { seo: platformSeo };
		}

		const landing = tenantLandingRegistry[tenantContext.tenant.slug];

		if (!landing) {
			throw notFound();
		}

		return { seo: landing.seo };
	},
	head: ({ loaderData }) => {
		const seo = loaderData?.seo ?? platformSeo;

		return {
			meta: [
				{ title: seo.title },
				{ name: "description", content: seo.description },
				{
					property: "og:title",
					content: seo.ogTitle ?? seo.title,
				},
				{
					property: "og:description",
					content: seo.ogDescription ?? seo.description,
				},
				{ property: "og:type", content: "website" },
				{ name: "twitter:card", content: "summary_large_image" },
				{
					name: "twitter:title",
					content: seo.ogTitle ?? seo.title,
				},
				{
					name: "twitter:description",
					content: seo.ogDescription ?? seo.description,
				},
			],
		};
	},
	component: HomePage,
});

function HomePage() {
	const { tenantContext } = Route.useRouteContext();

	if (tenantContext.face === "platform") {
		return <DepiqoLandingPage />;
	}

	if (tenantContext.face === "admin") {
		throw redirect({ to: "/dashboard" });
	}

	const landing = tenantLandingRegistry[tenantContext.tenant.slug];

	if (!landing) {
		throw notFound();
	}

	const LandingPage = landing.component;

	return <LandingPage />;
}
