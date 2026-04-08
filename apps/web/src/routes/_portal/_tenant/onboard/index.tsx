import { OnboardingStatus } from "@repo/types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureValidSession } from "@/features/auth/get-session";
import { CustomerForm } from "@/features/customer/components/onboard-form/onboard-form";
import {
	createOnboardPrefillValues,
	type OnboardPrefillValues,
	toOnboardFormValues,
} from "@/features/customer/schemas/onboard-form.schema";
import { portalCustomerQueries } from "@/features/rental/customer/customer.queries";
import { getProblemDetailsStatus } from "@/shared/errors";
import { getTenantBranding } from "@/features/tenant-branding/tenant-branding";
import { Button } from "@/components/ui/button";
import { RentalHeaderAuthAction } from "@/features/rental/auth/components/rental-header-auth-action";

interface OnboardLoaderData {
	customerId: string;
	mode: "submit" | "resubmit";
	initialValues: OnboardPrefillValues;
}

const REJECTED_PREFILL_VALUES: OnboardPrefillValues =
	createOnboardPrefillValues({
		fullName: "Ada Lovelace",
		phone: "+54 9 11 5555-0101",
		birthDate: "1992-06-15",
		documentNumber: "30123456",
		currentIdentityDocumentPath:
			"customers/dummy-customer/identity-document-existing.pdf",
		address: "Av. Corrientes 1234, Piso 2",
		city: "Buenos Aires",
		stateRegion: "Buenos Aires",
		country: "Argentina",
		occupation: "Productora audiovisual",
		company: "Estudio Prisma",
		taxId: "27-30123456-4",
		businessName: "Prisma Producciones SRL",
		bankName: "Banco Nación",
		accountNumber: "2850012345678901234567",
		contact1Name: "María García",
		contact1Relationship: "Socia",
		contact2Name: "Carlos López",
		contact2Relationship: "Hermano",
	});

export const Route = createFileRoute("/_portal/_tenant/onboard/")({
	beforeLoad: async ({ context }) => {
		await ensureValidSession({ data: context.tenantContext.face });
	},
	loader: async ({ context: { queryClient } }): Promise<OnboardLoaderData> => {
		const customer = await queryClient.ensureQueryData(
			portalCustomerQueries.me(),
		);
		let hasSubmittedProfile = false;

		try {
			await queryClient.ensureQueryData(portalCustomerQueries.profile());
			hasSubmittedProfile = true;
		} catch (error) {
			if (getProblemDetailsStatus(error) !== 404) {
				throw error;
			}
		}

		if (customer.onboardingStatus === OnboardingStatus.APPROVED) {
			throw redirect({ to: "/rental" });
		}

		if (
			customer.onboardingStatus === OnboardingStatus.PENDING &&
			hasSubmittedProfile
		) {
			throw redirect({ to: "/rental" });
		}

		if (customer.onboardingStatus === OnboardingStatus.REJECTED) {
			return {
				customerId: customer.id,
				mode: "resubmit" as const,
				initialValues: REJECTED_PREFILL_VALUES,
			};
		}

		return {
			customerId: customer.id,
			mode: "submit" as const,
			initialValues: createOnboardPrefillValues(),
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { tenantContext } = Route.useRouteContext();
	const { customerId, initialValues, mode } = Route.useLoaderData();
	const defaultValues = toOnboardFormValues(initialValues);

	const branding = getTenantBranding(tenantContext.tenant);

	return (
		<div className="space-y-10 min-h-svh bg-neutral-50">
			<header className="sticky top-0 z-10 bg-white border-b">
				<div className="container flex items-center justify-between h-16 mx-auto px-4">
					{/* ── Logo + nav — hidden when mobile search is open ── */}
					<div className="flex items-center gap-4 transition-all">
						{branding.logoSrc ? (
							<img
								src={branding.logoSrc}
								alt={branding.tenantName}
								className="h-10 w-auto object-contain"
							/>
						) : (
							<span className="text-xl font-bold text-primary">
								{branding.tenantName}
							</span>
						)}
						<nav className="hidden md:flex gap-4 text-sm font-medium">
							<Button variant="ghost" className="text-primary">
								Rental
							</Button>
						</nav>
					</div>

					<div className="flex items-center gap-1">
						<RentalHeaderAuthAction />
					</div>
				</div>
			</header>

			<main className="py-10">
				<CustomerForm
					customerId={customerId}
					defaultValues={defaultValues}
					mode={mode}
				/>
			</main>
		</div>
	);
}
