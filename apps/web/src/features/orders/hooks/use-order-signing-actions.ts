import { useState } from "react";
import { toast } from "sonner";
import { useCreateOrderSigningSession } from "@/features/document-signing/document-signing.queries";
import type { SendOrderSigningInvitationDto } from "@/features/document-signing/document-signing.schema";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";
import { ProblemDetailsError } from "@/shared/errors";

export type OrderSigningDialogIntent = "send" | "resend";

export function useOrderSigningActions(order: ParsedOrderDetailResponseDto) {
	const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
	const [dialogIntent, setDialogIntent] =
		useState<OrderSigningDialogIntent>("send");
	const [submitError, setSubmitError] = useState<string | null>(null);

	const createSessionMutation = useCreateOrderSigningSession();

	function openSendDialog() {
		setDialogIntent("send");
		setSubmitError(null);
		setIsInvitationDialogOpen(true);
	}

	function openResendDialog() {
		setDialogIntent("resend");
		setSubmitError(null);
		setIsInvitationDialogOpen(true);
	}

	function handleInvitationDialogOpenChange(open: boolean) {
		setIsInvitationDialogOpen(open);

		if (!open) {
			setSubmitError(null);
		}
	}

	async function submitInvitation(dto: SendOrderSigningInvitationDto) {
		setSubmitError(null);

		try {
			const result = await createSessionMutation.mutateAsync({
				params: { orderId: order.id },
				dto,
			});

			toast.success(
				dialogIntent === "send"
					? result.reusedExistingSession
						? "La invitacion ya estaba activa y fue reenviada."
						: "Invitacion de firma enviada."
					: result.reusedExistingSession
						? "Invitacion de firma reenviada."
						: "Se genero una nueva invitacion de firma.",
			);

			setIsInvitationDialogOpen(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setSubmitError(
					error.problemDetails.detail ||
						error.problemDetails.title ||
						"No pudimos enviar la invitacion de firma.",
				);
				return;
			}

			setSubmitError("No pudimos enviar la invitacion de firma.");
		}
	}

	return {
		isInvitationDialogOpen,
		setIsInvitationDialogOpen: handleInvitationDialogOpenChange,
		dialogIntent,
		submitError,
		isPending: createSessionMutation.isPending,
		openSendDialog,
		openResendDialog,
		submitInvitation,
	};
}
