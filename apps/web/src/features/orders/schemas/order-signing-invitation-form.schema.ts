import { z } from "zod";
import type { SendOrderSigningInvitationDto } from "@/features/document-signing/document-signing.schema";

export const orderSigningInvitationFormSchema = z.object({
	recipientEmail: z.string().trim().email("Ingresa un email valido."),
});

export type OrderSigningInvitationFormValues = z.infer<
	typeof orderSigningInvitationFormSchema
>;

export function createOrderSigningInvitationFormDefaults(
	recipientEmail: string | null | undefined,
): OrderSigningInvitationFormValues {
	return {
		recipientEmail: recipientEmail ?? "",
	};
}

export function toOrderSigningInvitationDto(
	values: OrderSigningInvitationFormValues,
): SendOrderSigningInvitationDto {
	return {
		recipientEmail: values.recipientEmail.trim(),
	};
}
