import { z } from "zod";
import {
	type AcceptPublicSigningSessionDto,
	type PublicSigningSessionResponseDto,
	RENTAL_AGREEMENT_ACCEPTANCE_TEXT_VERSION,
} from "./document-signing.schema";

export const publicSigningFormSchema = z.object({
	declaredFullName: z.string().trim().min(1, "Ingresa tu nombre completo."),
	declaredDocumentNumber: z
		.string()
		.trim()
		.min(1, "Ingresa tu numero de documento."),
	accepted: z.boolean().refine((value) => value, {
		message: "Debes confirmar que revisaste y aceptas el contrato.",
	}),
});

export type PublicSigningFormValues = z.infer<typeof publicSigningFormSchema>;

export function createPublicSigningFormDefaults(
	session: Pick<PublicSigningSessionResponseDto, "prefilledSigner">,
): PublicSigningFormValues {
	return {
		declaredFullName: session.prefilledSigner.fullName ?? "",
		declaredDocumentNumber: session.prefilledSigner.documentNumber ?? "",
		accepted: false,
	};
}

export function toAcceptPublicSigningSessionDto(
	values: PublicSigningFormValues,
): AcceptPublicSigningSessionDto {
	return {
		declaredFullName: values.declaredFullName.trim(),
		declaredDocumentNumber: values.declaredDocumentNumber.trim(),
		acceptanceTextVersion: RENTAL_AGREEMENT_ACCEPTANCE_TEXT_VERSION,
		accepted: true,
	};
}
