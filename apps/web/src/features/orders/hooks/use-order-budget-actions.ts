import type { GenerateOrderBudgetRequestDto } from "@repo/schemas";
import { useState } from "react";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";
import {
	type ContractErrorState,
	fetchDocumentBlob,
	openPreviewWindow,
} from "../order-document.utils";

type UseOrderBudgetActionsParams = {
	order: ParsedOrderDetailResponseDto;
	setContractError: (value: ContractErrorState) => void;
	setContractBusinessErrorMessage: (value: string | null) => void;
	setIsContractBusinessErrorOpen: (value: boolean) => void;
};

export function useOrderBudgetActions({
	order,
	setContractError,
	setContractBusinessErrorMessage,
	setIsContractBusinessErrorOpen,
}: UseOrderBudgetActionsParams) {
	const [isOpeningBudget, setIsOpeningBudget] = useState(false);
	const [isBudgetCustomerDialogOpen, setIsBudgetCustomerDialogOpen] =
		useState(false);

	const executeOpenBudget = async (
		body: GenerateOrderBudgetRequestDto,
	): Promise<boolean> => {
		const previewWindow = openPreviewWindow();

		setIsOpeningBudget(true);
		setContractError(null);

		const result = await fetchDocumentBlob({
			url: `/api/orders/${order.id}/budget`,
			method: "POST",
			body,
			fallbackMessage: "No pudimos abrir el presupuesto. Intenta nuevamente.",
			notFoundMessage:
				"No pudimos encontrar el pedido para generar el presupuesto.",
		});

		if (result.ok) {
			const objectUrl = URL.createObjectURL(result.blob);

			if (previewWindow) {
				previewWindow.location.href = objectUrl;
			} else {
				window.open(objectUrl, "_blank", "noopener,noreferrer");
			}

			window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
			setIsOpeningBudget(false);
			return true;
		}

		previewWindow?.close();

		if (result.isBusinessError) {
			setContractBusinessErrorMessage(result.message);
			setIsContractBusinessErrorOpen(true);
		} else {
			setContractError({
				status: result.status,
				message: result.message,
			});
		}

		setIsOpeningBudget(false);
		return false;
	};

	const handleOpenBudget = async () => {
		if (order.customer) {
			await executeOpenBudget({});
			return;
		}

		setIsBudgetCustomerDialogOpen(true);
	};

	const handleBudgetCustomerDialogOpenChange = (open: boolean) => {
		setIsBudgetCustomerDialogOpen(open);
	};

	const handleSubmitBudgetCustomer = async (
		body: GenerateOrderBudgetRequestDto,
	) => {
		const didOpen = await executeOpenBudget(body);

		if (didOpen) {
			handleBudgetCustomerDialogOpenChange(false);
		}
	};

	return {
		isBudgetCustomerDialogOpen,
		isOpeningBudget,
		handleBudgetCustomerDialogOpenChange,
		handleOpenBudget,
		handleSubmitBudgetCustomer,
	};
}
