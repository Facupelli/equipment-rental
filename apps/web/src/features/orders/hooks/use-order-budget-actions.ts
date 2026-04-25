import type { GenerateOrderBudgetRequestDto } from "@repo/schemas";
import { useState } from "react";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";
import {
	type ContractErrorState,
	fetchDocumentBlob,
	openPreviewWindow,
} from "../order-document.utils";

type BudgetDocumentIntent = "open" | "download" | null;

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
	const [isDownloadingBudget, setIsDownloadingBudget] = useState(false);
	const [isBudgetCustomerDialogOpen, setIsBudgetCustomerDialogOpen] =
		useState(false);
	const [budgetDocumentIntent, setBudgetDocumentIntent] =
		useState<BudgetDocumentIntent>(null);

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
				action: "open",
			});
		}

		setIsOpeningBudget(false);
		return false;
	};

	const executeDownloadBudget = async (
		body: GenerateOrderBudgetRequestDto,
	): Promise<boolean> => {
		setIsDownloadingBudget(true);
		setContractError(null);

		const result = await fetchDocumentBlob({
			url: `/api/orders/${order.id}/budget/download`,
			method: "POST",
			body,
			fallbackMessage:
				"No pudimos descargar el presupuesto. Intenta nuevamente.",
			notFoundMessage:
				"No pudimos encontrar el pedido para generar el presupuesto.",
		});

		if (result.ok) {
			const objectUrl = URL.createObjectURL(result.blob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download =
				result.fileName ??
				`presupuesto-${String(order.number).padStart(4, "0")}.pdf`;
			document.body.append(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
			setIsDownloadingBudget(false);
			return true;
		}

		if (result.isBusinessError) {
			setContractBusinessErrorMessage(result.message);
			setIsContractBusinessErrorOpen(true);
		} else {
			setContractError({
				status: result.status,
				message: result.message,
				action: "download",
			});
		}

		setIsDownloadingBudget(false);
		return false;
	};

	const handleOpenBudget = async () => {
		if (order.customer) {
			await executeOpenBudget({});
			return;
		}

		setBudgetDocumentIntent("open");
		setIsBudgetCustomerDialogOpen(true);
	};

	const handleDownloadBudget = async () => {
		if (order.customer) {
			await executeDownloadBudget({});
			return;
		}

		setBudgetDocumentIntent("download");
		setIsBudgetCustomerDialogOpen(true);
	};

	const handleBudgetCustomerDialogOpenChange = (open: boolean) => {
		setIsBudgetCustomerDialogOpen(open);

		if (!open) {
			setBudgetDocumentIntent(null);
		}
	};

	const handleSubmitBudgetCustomer = async (
		intent: Exclude<BudgetDocumentIntent, null>,
		body: GenerateOrderBudgetRequestDto,
	) => {
		if (intent === "open") {
			const didOpen = await executeOpenBudget(body);

			if (didOpen) {
				handleBudgetCustomerDialogOpenChange(false);
			}

			return;
		}

		const didDownload = await executeDownloadBudget(body);

		if (didDownload) {
			handleBudgetCustomerDialogOpenChange(false);
		}
	};

	return {
		budgetDocumentIntent,
		isBudgetCustomerDialogOpen,
		isOpeningBudget,
		isDownloadingBudget,
		handleBudgetCustomerDialogOpenChange,
		handleOpenBudget,
		handleDownloadBudget,
		handleSubmitBudgetCustomer,
	};
}
