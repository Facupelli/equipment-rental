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
	const [contractError, setContractError] = useState<ContractErrorState>(null);
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
			onBusinessError: () => {
				previewWindow?.close();
				setIsContractBusinessErrorOpen(true);
			},
			onRequestError: ({ status, message }) => {
				previewWindow?.close();
				setContractError({ status, message });
			},
			fallbackMessage: "No pudimos abrir el remito. Intenta nuevamente.",
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
			onBusinessError: () => {
				setIsContractBusinessErrorOpen(true);
			},
			onRequestError: ({ status, message }) => {
				setContractError({ status, message });
			},
			fallbackMessage: "No pudimos descargar el remito. Intenta nuevamente.",
		});

		if (canProceed) {
			window.location.assign(downloadUrl);
		}

		setIsDownloadingContract(false);
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
		handleConfirmOrderSubmission,
		handleConfirmCancelOrder,
		handleConfirmOrder,
		handleConfirmLifecycleAction,
		handleDownloadContract,
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
		isDownloadingContract,
		isLifecycleActionPending: isMarkingAsPickedUp || isMarkingAsReturned,
		isOpeningContract,
		lifecycleActionError,
		pendingLifecycleAction,
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
}: {
	url: string;
	onBusinessError: () => void;
	onRequestError: (error: { status: number; message: string }) => void;
	fallbackMessage: string;
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
			onBusinessError();
			return false;
		}

		onRequestError({
			status: response.status,
			message:
				payload?.message ??
				(response.status === 404
					? "No pudimos encontrar el pedido para generar el remito."
					: fallbackMessage),
		});
		return false;
	} catch {
		onRequestError({
			status: 500,
			message: fallbackMessage,
		});
		return false;
	}
}
