import { useState } from "react";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";
import { ProblemDetailsError } from "@/shared/errors";
import {
	useCancelOrder,
	useConfirmOrder,
	useMarkEquipmentAsRetired,
	useMarkEquipmentAsReturned,
} from "../orders.queries";

type ContractErrorState = {
 	status: number;
	message: string;
	action: "open" | "download";
} | null;

type OrderLifecycleAction = "pickup" | "return" | null;

function openPreviewWindow() {
 	const previewWindow = window.open("", "_blank");

 	if (previewWindow) {
		previewWindow.opener = null;
	}

 	return previewWindow;
}

export function useOrderActions(order: ParsedOrderDetailResponseDto) {
	const [isOpeningContract, setIsOpeningContract] = useState(false);
	const [isDownloadingContract, setIsDownloadingContract] = useState(false);
	const [isOpeningBudget, setIsOpeningBudget] = useState(false);
	const [isDownloadingBudget, setIsDownloadingBudget] = useState(false);
	const [contractError, setContractError] = useState<ContractErrorState>(null);
	const [contractBusinessErrorMessage, setContractBusinessErrorMessage] =
		useState<string | null>(null);
	const [isContractBusinessErrorOpen, setIsContractBusinessErrorOpen] =
		useState(false);
	const [pendingLifecycleAction, setPendingLifecycleAction] =
		useState<OrderLifecycleAction>(null);
	const [lifecycleActionError, setLifecycleActionError] = useState<string | null>(
		null,
	);
	const [isConfirmOrderDialogOpen, setIsConfirmOrderDialogOpen] = useState(false);
	const [confirmOrderError, setConfirmOrderError] = useState<string | null>(null);
	const [isCancelOrderDialogOpen, setIsCancelOrderDialogOpen] = useState(false);
	const [cancelOrderError, setCancelOrderError] = useState<string | null>(null);
	const { mutateAsync: cancelOrder, isPending: isCancellingOrder } =
		useCancelOrder();
	const { mutateAsync: confirmOrder, isPending: isConfirmingOrder } =
		useConfirmOrder();
	const { mutateAsync: markEquipmentAsRetired, isPending: isMarkingAsPickedUp } =
		useMarkEquipmentAsRetired();
	const { mutateAsync: markEquipmentAsReturned, isPending: isMarkingAsReturned } =
		useMarkEquipmentAsReturned();

	const handleOpenContract = async () => {
		const previewWindow = openPreviewWindow();

		setIsOpeningContract(true);
		setContractError(null);

		const contractUrl = `/api/orders/${order.id}/contract/`;
		const canProceed = await preflightContractRequest({
			url: contractUrl,
			onBusinessError: (message) => {
				previewWindow?.close();
				setContractBusinessErrorMessage(message);
				setIsContractBusinessErrorOpen(true);
			},
			onRequestError: ({ status, message, action }) => {
				previewWindow?.close();
				setContractError({ status, message, action });
			},
			fallbackMessage: "No pudimos abrir el remito. Intenta nuevamente.",
			notFoundMessage: "No pudimos encontrar el pedido para generar el remito.",
			action: "open",
		});

		if (canProceed) {
			if (previewWindow) {
				previewWindow.location.href = contractUrl;
			} else {
				window.open(contractUrl, "_blank", "noopener,noreferrer");
			}
		}

		setIsOpeningContract(false);
	};

	const handleDownloadContract = async () => {
		setIsDownloadingContract(true);
		setContractError(null);

		const downloadUrl = `/api/orders/${order.id}/contract/download`;
		const canProceed = await preflightContractRequest({
			url: downloadUrl,
			onBusinessError: (message) => {
				setContractBusinessErrorMessage(message);
				setIsContractBusinessErrorOpen(true);
			},
			onRequestError: ({ status, message, action }) => {
				setContractError({ status, message, action });
			},
			fallbackMessage: "No pudimos descargar el remito. Intenta nuevamente.",
			notFoundMessage: "No pudimos encontrar el pedido para generar el remito.",
			action: "download",
		});

		if (canProceed) {
			window.location.assign(downloadUrl);
		}

		setIsDownloadingContract(false);
	};

	const handleOpenBudget = async () => {
		const previewWindow = openPreviewWindow();

		setIsOpeningBudget(true);
		setContractError(null);

		const result = await fetchDocumentBlob({
			url: `/api/orders/${order.id}/budget`,
			method: "POST",
			body: {},
			fallbackMessage: "No pudimos abrir el presupuesto. Intenta nuevamente.",
			notFoundMessage: "No pudimos encontrar el pedido para generar el presupuesto.",
		});

		if (result.ok) {
			const objectUrl = URL.createObjectURL(result.blob);

			if (previewWindow) {
				previewWindow.location.href = objectUrl;
			} else {
				window.open(objectUrl, "_blank", "noopener,noreferrer");
			}

			window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
		} else if (result.isBusinessError) {
			previewWindow?.close();
			setContractBusinessErrorMessage(result.message);
			setIsContractBusinessErrorOpen(true);
		} else {
			previewWindow?.close();
			setContractError({
				status: result.status,
				message: result.message,
				action: "open",
			});
		}

		setIsOpeningBudget(false);
	};

	const handleDownloadBudget = async () => {
		setIsDownloadingBudget(true);
		setContractError(null);

		const result = await fetchDocumentBlob({
			url: `/api/orders/${order.id}/budget/download`,
			method: "POST",
			body: {},
			fallbackMessage: "No pudimos descargar el presupuesto. Intenta nuevamente.",
			notFoundMessage: "No pudimos encontrar el pedido para generar el presupuesto.",
		});

		if (result.ok) {
			const objectUrl = URL.createObjectURL(result.blob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download =
				result.fileName ?? `presupuesto-${String(order.number).padStart(4, "0")}.pdf`;
			document.body.append(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} else if (result.isBusinessError) {
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
	};

	const handleEditOrder = () => {
		// TODO: navigate to edit order page or open edit modal
	};

	const handleConfirmOrder = () => {
		setConfirmOrderError(null);
		setIsConfirmOrderDialogOpen(true);
	};

	const handleConfirmOrderSubmission = async () => {
		setConfirmOrderError(null);

		if (!order.customer) {
			setConfirmOrderError(
				"Este borrador necesita un cliente vinculado antes de poder confirmarse.",
			);
			return;
		}

		try {
			await confirmOrder({ orderId: order.id });
			setIsConfirmOrderDialogOpen(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setConfirmOrderError(getConfirmOrderErrorMessage(error));
				return;
			}

			setConfirmOrderError("Ocurrio un error al confirmar el pedido.");
		}
	};

	const handleMarkAsPickedUp = () => {
		setLifecycleActionError(null);
		setPendingLifecycleAction("pickup");
	};

	const handleMarkAsReturned = () => {
		setLifecycleActionError(null);
		setPendingLifecycleAction("return");
	};

	const handleOpenCancelOrder = () => {
		setCancelOrderError(null);
		setIsCancelOrderDialogOpen(true);
	};

	const handleConfirmCancelOrder = async () => {
		setCancelOrderError(null);

		try {
			await cancelOrder({ orderId: order.id });
			setIsCancelOrderDialogOpen(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setCancelOrderError(
					error.problemDetails.detail ??
						error.problemDetails.title ??
						"No pudimos cancelar el pedido.",
				);
				return;
			}

			setCancelOrderError("Ocurrio un error al cancelar el pedido.");
		}
	};

	const handleConfirmLifecycleAction = async () => {
		if (!pendingLifecycleAction) {
			return;
		}

		setLifecycleActionError(null);

		try {
			if (pendingLifecycleAction === "pickup") {
				await markEquipmentAsRetired({ orderId: order.id });
			} else {
				await markEquipmentAsReturned({ orderId: order.id });
			}

			setPendingLifecycleAction(null);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setLifecycleActionError(
					error.problemDetails.detail ??
						error.problemDetails.title ??
						"No pudimos actualizar el estado del pedido.",
				);
				return;
			}

			setLifecycleActionError("Ocurrio un error al actualizar el estado del pedido.");
		}
	};

	const setIsLifecycleActionDialogOpen = (open: boolean) => {
		if (!open) {
			setLifecycleActionError(null);
			setPendingLifecycleAction(null);
		}
	};

	const setIsCancelOrderDialogOpenWithReset = (open: boolean) => {
		if (!open) {
			setCancelOrderError(null);
		}

		setIsCancelOrderDialogOpen(open);
	};

	const setIsConfirmOrderDialogOpenWithReset = (open: boolean) => {
		if (!open) {
			setConfirmOrderError(null);
		}

		setIsConfirmOrderDialogOpen(open);
	};

	const handleReleaseEquipment = () => {
		// TODO: trigger release equipment mutation, then invalidate order query
	};

	const handleProcessPayment = () => {
		// TODO: trigger process payment mutation, then invalidate order query
	};

	return {
		cancelOrderError,
		contractError,
		confirmOrderError,
		contractBusinessErrorMessage,
		handleConfirmOrderSubmission,
		handleConfirmCancelOrder,
		handleConfirmOrder,
		handleConfirmLifecycleAction,
		handleDownloadBudget,
		handleDownloadContract,
		handleOpenBudget,
		handleOpenCancelOrder,
		handleOpenContract,
		handleEditOrder,
		handleMarkAsPickedUp,
		handleMarkAsReturned,
		handleReleaseEquipment,
		handleProcessPayment,
		isCancelOrderDialogOpen,
		isCancelOrderPending: isCancellingOrder,
		isConfirmOrderDialogOpen,
		isConfirmOrderPending: isConfirmingOrder,
		isContractBusinessErrorOpen,
		isDownloadingBudget,
		isDownloadingContract,
		isLifecycleActionPending: isMarkingAsPickedUp || isMarkingAsReturned,
		isOpeningBudget,
		isOpeningContract,
		lifecycleActionError,
		pendingLifecycleAction,
		setContractBusinessErrorMessage,
		setContractError,
		setIsCancelOrderDialogOpen: setIsCancelOrderDialogOpenWithReset,
		setIsConfirmOrderDialogOpen: setIsConfirmOrderDialogOpenWithReset,
		setIsContractBusinessErrorOpen,
		setIsLifecycleActionDialogOpen,
	};
}

function getConfirmOrderErrorMessage(error: ProblemDetailsError): string {
	const fallbackMessage =
		error.problemDetails.detail ??
		error.problemDetails.title ??
		"No pudimos confirmar el pedido.";

	switch (error.problemDetails.type) {
		case "errors://order-customer-required":
			return "Este borrador necesita un cliente vinculado antes de poder confirmarse.";
		case "errors://order-items-unavailable":
			return (
				error.problemDetails.detail ??
				"No pudimos confirmar el borrador porque uno o más equipos ya no estan disponibles para este periodo."
			);
		default:
			return fallbackMessage;
	}
}

async function preflightContractRequest({
	url,
	onBusinessError,
	onRequestError,
	fallbackMessage,
	notFoundMessage,
	action,
}: {
	url: string;
	onBusinessError: (message: string) => void;
	onRequestError: (error: {
		status: number;
		message: string;
		action: "open" | "download";
	}) => void;
	fallbackMessage: string;
	notFoundMessage: string;
	action: "open" | "download";
}): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: "GET",
			credentials: "same-origin",
		});

		if (response.ok) {
			return true;
		}

		const payload = (await response.json().catch(() => null)) as {
			message?: string;
		} | null;

		if (response.status === 422) {
			onBusinessError(payload?.message ?? fallbackMessage);
			return false;
		}

		onRequestError({
			status: response.status,
			action,
			message:
				payload?.message ??
				(response.status === 404 ? notFoundMessage : fallbackMessage),
		});
		return false;
	} catch {
		onRequestError({
			status: 500,
			message: fallbackMessage,
			action,
		});
		return false;
	}
}

async function fetchDocumentBlob({
	url,
	method,
	body,
	fallbackMessage,
	notFoundMessage,
}: {
	url: string;
	method: "POST";
	body: Record<string, never>;
	fallbackMessage: string;
	notFoundMessage: string;
}): Promise<
	| { ok: true; blob: Blob; fileName: string | null }
	| { ok: false; status: number; message: string; isBusinessError: boolean }
> {
	try {
		const response = await fetch(url, {
			method,
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (response.ok) {
			return {
				ok: true,
				blob: await response.blob(),
				fileName: getFileNameFromContentDisposition(
					response.headers.get("Content-Disposition"),
				),
			};
		}

		const payload = (await response.json().catch(() => null)) as {
			message?: string;
		} | null;
		const message =
			payload?.message ??
			(response.status === 404 ? notFoundMessage : fallbackMessage);

		return {
			ok: false,
			status: response.status || 500,
			message,
			isBusinessError: response.status === 422,
		};
	} catch {
		return {
			ok: false,
			status: 500,
			message: fallbackMessage,
			isBusinessError: false,
		};
	}
}

function getFileNameFromContentDisposition(
	contentDisposition: string | null,
): string | null {
	if (!contentDisposition) {
		return null;
	}

	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

	if (utf8Match?.[1]) {
		return decodeURIComponent(utf8Match[1]);
	}

	const asciiMatch = contentDisposition.match(/filename="?([^\"]+)"?/i);
	return asciiMatch?.[1] ?? null;
}
