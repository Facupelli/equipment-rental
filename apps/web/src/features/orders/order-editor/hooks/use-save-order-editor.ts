import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDraftOrderContext } from "@/features/orders/draft-order/draft-order.context";
import {
	buildCreateDraftOrderPayload,
	validateDraftOrderForSave,
} from "@/features/orders/draft-order/utils/draft-order-save";
import {
	useCreateDraftOrder,
	useEditOrder,
	useUpdateDraftOrder,
} from "@/features/orders/orders.queries";
import type { OrderEditorMode } from "@/features/orders/order-editor/types/order-editor.types";
import { getOrderEditorCopy } from "@/features/orders/order-editor/utils/order-editor-copy";
import { useLocationId } from "@/shared/contexts/location/location.hooks";
import { ProblemDetailsError } from "@/shared/errors";

export function useSaveOrderEditor(
	orderId?: string,
	mode: OrderEditorMode = "edit-draft",
) {
	const navigate = useNavigate();
	const locationId = useLocationId();
	const copy = getOrderEditorCopy(mode);
	const { state } = useDraftOrderContext();
	const { mutateAsync: createDraftOrder, isPending: isCreatePending } =
		useCreateDraftOrder();
	const { mutateAsync: updateDraftOrder, isPending: isUpdatePending } =
		useUpdateDraftOrder();
	const { mutateAsync: editOrder, isPending: isEditPending } = useEditOrder();
	const [saveError, setSaveError] = useState<string | null>(null);

	async function handleSaveOrderEditor() {
		setSaveError(null);

		const validationError = validateDraftOrderForSave({
			state,
			locationId,
			mode,
		});

		if (validationError) {
			setSaveError(validationError);
			return;
		}

		if (!locationId) {
			setSaveError(copy.locationRequiredText);
			return;
		}

		const payload = buildCreateDraftOrderPayload({
			state,
			locationId,
		});

		try {
			if (orderId && mode === "edit-draft") {
				await updateDraftOrder({ orderId, data: payload });
				await navigate({
					to: "/dashboard/orders/$orderId",
					params: { orderId },
				});
			} else if (
				orderId &&
				(mode === "edit-pending-review" || mode === "edit-confirmed")
			) {
				await editOrder({ orderId, data: payload });
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
			setSaveError(getSaveErrorMessage(error, mode));
		}
	}

	return {
		handleSaveOrderEditor,
		saveError,
		isSaving: isCreatePending || isUpdatePending || isEditPending,
		hasBudget: state.budget !== null,
	};
}

function getSaveErrorMessage(error: unknown, mode: OrderEditorMode): string {
	const fallback =
		mode === "create-draft" || mode === "edit-draft"
			? "No pudimos guardar el borrador."
			: "No pudimos guardar los cambios del pedido.";

	if (error instanceof ProblemDetailsError) {
		return error.problemDetails.detail ?? error.problemDetails.title ?? fallback;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return fallback;
}
