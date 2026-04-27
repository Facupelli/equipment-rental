import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDraftOrderContext } from "@/features/orders/draft-order/draft-order.context";
import {
	buildCreateDraftOrderPayload,
	validateDraftOrderForSave,
} from "@/features/orders/draft-order/utils/draft-order-save";
import {
	useCreateDraftOrder,
	useUpdateDraftOrder,
} from "@/features/orders/orders.queries";
import { useLocationId } from "@/shared/contexts/location/location.hooks";
import { ProblemDetailsError } from "@/shared/errors";

export function useSaveDraftOrder(orderId?: string) {
	const navigate = useNavigate();
	const locationId = useLocationId();
	const { state } = useDraftOrderContext();
	const { mutateAsync: createDraftOrder, isPending: isCreatePending } =
		useCreateDraftOrder();
	const { mutateAsync: updateDraftOrder, isPending: isUpdatePending } =
		useUpdateDraftOrder();
	const [saveError, setSaveError] = useState<string | null>(null);

	async function handleSaveDraft() {
		setSaveError(null);

		const validationError = validateDraftOrderForSave({
			state,
			locationId,
		});

		if (validationError) {
			setSaveError(validationError);
			return;
		}

		if (!locationId) {
			setSaveError("Seleccioná una locación antes de guardar el borrador.");
			return;
		}

		const payload = buildCreateDraftOrderPayload({
			state,
			locationId,
		});

		try {
			if (orderId) {
				await updateDraftOrder({ orderId, data: payload });
				await navigate({
					to: "/dashboard/orders/$orderId",
					params: { orderId },
				});
			} else {
				const newOrderId = await createDraftOrder(payload);
				await navigate({
					to: "/dashboard/orders/$orderId",
					params: { orderId: newOrderId },
				});
			}
		} catch (error) {
			setSaveError(getSaveErrorMessage(error));
		}
	}

	return {
		handleSaveDraft,
		saveError,
		isSaving: isCreatePending || isUpdatePending,
		hasBudget: state.budget !== null,
	};
}

function getSaveErrorMessage(error: unknown): string {
	if (error instanceof ProblemDetailsError) {
		return (
			error.problemDetails.detail ??
			error.problemDetails.title ??
			"No pudimos guardar el borrador."
		);
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "No pudimos guardar el borrador.";
}
