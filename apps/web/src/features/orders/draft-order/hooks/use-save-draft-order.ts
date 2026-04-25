import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useDraftOrderContext } from "@/features/orders/draft-order/draft-order.context";
import {
	buildCreateDraftOrderPayload,
	buildManualOverridePricingPayload,
	validateDraftOrderForSave,
} from "@/features/orders/draft-order/utils/draft-order-save";
import {
	useCreateDraftOrder,
	useUpdateDraftOrderPricing,
} from "@/features/orders/orders.queries";
import { createOrderDetailQueryOptions } from "@/features/orders/queries/get-order-by-id";
import { useLocationId } from "@/shared/contexts/location/location.hooks";
import { ProblemDetailsError } from "@/shared/errors";

export function useSaveDraftOrder() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const locationId = useLocationId();
	const { state } = useDraftOrderContext();
	const { mutateAsync: createDraftOrder, isPending: isCreatePending } =
		useCreateDraftOrder();
	const { mutateAsync: updateDraftOrderPricing, isPending: isPricingPending } =
		useUpdateDraftOrderPricing();
	const [saveError, setSaveError] = useState<string | null>(null);

	const hasManualOverrides = state.items.some(
		(item) => item.manualOverride !== null,
	);

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

		try {
			const orderId = await createDraftOrder(
				buildCreateDraftOrderPayload({
					state,
					locationId,
				}),
			);

			if (hasManualOverrides) {
				try {
					const order = await queryClient.fetchQuery(
						createOrderDetailQueryOptions({ orderId }),
					);
					const pricingPayload = buildManualOverridePricingPayload({
						localItems: state.items,
						persistedItems: order.items,
					});

					if (pricingPayload) {
						await updateDraftOrderPricing({
							params: { orderId },
							dto: pricingPayload,
						});
					}
				} catch (_error) {
					toast.warning(
						"El borrador se creó correctamente, pero los overrides de pricing no se pudieron guardar por completo. Revisá el pricing en el detalle del borrador.",
					);

					await navigate({
						to: "/dashboard/orders/$orderId",
						params: { orderId },
					});

					return;
				}
			}

			await navigate({
				to: "/dashboard/orders/$orderId",
				params: { orderId },
			});
		} catch (error) {
			setSaveError(getSaveErrorMessage(error));
		}
	}

	return {
		handleSaveDraft,
		saveError,
		isSaving: isCreatePending || isPricingPending,
		hasManualOverrides,
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
