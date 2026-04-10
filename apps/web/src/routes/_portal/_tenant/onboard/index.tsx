import { OnboardingStatus } from "@repo/types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCustomerSessionFn } from "@/features/auth/auth-guards.api";
import { CustomerForm } from "@/features/customer/components/onboard-form/onboard-form";
import {
	createOnboardPrefillValues,
	type OnboardPrefillValues,
	toOnboardPrefillValues,
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

export const Route = createFileRoute("/_portal/_tenant/onboard/")({
	beforeLoad: async ({ location }) => {
		const redirectTo = `${location.pathname}${location.searchStr ?? ""}${location.hash ?? ""}`;

		await requireCustomerSessionFn({
			data: {
				loginPath: "/login",
				redirectTo,
			},
		});
	},
	loader: async ({ context: { queryClient } }): Promise<OnboardLoaderData> => {
		const customer = await queryClient.ensureQueryData(
			portalCustomerQueries.me(),
		);
		let submittedProfile = null;

		try {
			submittedProfile = await queryClient.ensureQueryData(
				portalCustomerQueries.profile(),
			);
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
			submittedProfile
		) {
			throw redirect({ to: "/rental" });
		}

		if (customer.onboardingStatus === OnboardingStatus.REJECTED) {
			return {
				customerId: customer.id,
				mode: "resubmit" as const,
				initialValues: submittedProfile
					? toOnboardPrefillValues(submittedProfile)
					: createOnboardPrefillValues(),
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
