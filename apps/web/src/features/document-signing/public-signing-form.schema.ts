import { z } from "zod";
import {
	type AcceptPublicSigningSessionDto,
	RENTAL_AGREEMENT_ACCEPTANCE_TEXT_VERSION,
} from "./document-signing.schema";

export const publicSigningFormSchema = z.object({
	signatureImageDataUrl: z
		.string()
		.trim()
		.min(1, "Dibuja tu firma para continuar."),
	accepted: z.boolean().refine((value) => value, {
		message: "Debes confirmar que revisaste y aceptas el contrato.",
	}),
});

export type PublicSigningFormValues = z.infer<typeof publicSigningFormSchema>;

export function createPublicSigningFormDefaults(): PublicSigningFormValues {
	return {
		signatureImageDataUrl: "",
		accepted: false,
	};
}

export function toAcceptPublicSigningSessionDto(
	values: PublicSigningFormValues,
): AcceptPublicSigningSessionDto {
	return {
		signatureImageDataUrl: values.signatureImageDataUrl.trim(),
		acceptanceTextVersion: RENTAL_AGREEMENT_ACCEPTANCE_TEXT_VERSION,
		accepted: true,
	};
}
