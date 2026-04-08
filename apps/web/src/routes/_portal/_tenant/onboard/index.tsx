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
		existingIdentityDocumentPath:
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
	const { customerId, initialValues, mode } = Route.useLoaderData();
	const defaultValues = toOnboardFormValues(initialValues);

	return (
		<CustomerForm
			customerId={customerId}
			defaultValues={defaultValues}
			mode={mode}
		/>
	);
}
