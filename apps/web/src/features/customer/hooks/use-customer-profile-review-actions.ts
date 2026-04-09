import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	useApproveCustomerProfile,
	useRejectCustomerProfile,
} from "@/features/customer/customer.queries";
import { ProblemDetailsError } from "@/shared/errors";

type UseCustomerProfileReviewActionsParams = {
	customerProfileId: string;
};

export function useCustomerProfileReviewActions({
	customerProfileId,
}: UseCustomerProfileReviewActionsParams) {
	const navigate = useNavigate();
	const approveMutation = useApproveCustomerProfile();
	const rejectMutation = useRejectCustomerProfile();
	const [auditorNotes, setAuditorNotes] = useState("");
	const [reviewError, setReviewError] = useState<string | null>(null);

	const isSubmitting = approveMutation.isPending || rejectMutation.isPending;

	function handleAuditorNotesChange(value: string) {
		setAuditorNotes(value);
		if (reviewError) {
			setReviewError(null);
		}
	}

	async function handleApprove() {
		setReviewError(null);

		try {
			await approveMutation.mutateAsync({
				customerProfileId,
				dto: {},
			});

			navigate({ to: "/dashboard/customers/pending-profiles" });
		} catch (error) {
			setReviewError(getReviewActionErrorMessage(error));
		}
	}

	async function handleReject() {
		const reason = auditorNotes.trim();

		if (!reason) {
			setReviewError("Debes ingresar un motivo para rechazar la solicitud.");
			return;
		}

		setReviewError(null);

		try {
			await rejectMutation.mutateAsync({
				customerProfileId,
				dto: { reason },
			});

			navigate({ to: "/dashboard/customers/pending-profiles" });
		} catch (error) {
			setReviewError(getReviewActionErrorMessage(error));
		}
	}

	return {
		auditorNotes,
		handleApprove,
		handleAuditorNotesChange,
		handleReject,
		isSubmitting,
		reviewError,
	};
}

function getReviewActionErrorMessage(error: unknown) {
	if (error instanceof ProblemDetailsError) {
		return error.problemDetails.detail || error.problemDetails.title;
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "No pudimos procesar la revision del expediente.";
}
