import { useState } from "react";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";

type ContractErrorState = {
	status: number;
	message: string;
} | null;

function openPreviewWindow() {
	const previewWindow = window.open("", "_blank");

	if (previewWindow) {
		previewWindow.opener = null;
	}

	return previewWindow;
}

export function useOrderActions(order: ParsedOrderDetailResponseDto) {
	const [isOpeningContract, setIsOpeningContract] = useState(false);
	const [contractError, setContractError] = useState<ContractErrorState>(null);
	const [isContractBusinessErrorOpen, setIsContractBusinessErrorOpen] =
		useState(false);

	const handleOpenContract = async () => {
		const previewWindow = openPreviewWindow();

		setIsOpeningContract(true);
		setContractError(null);

		try {
			const response = await fetch(`/api/orders/${order.id}/contract`, {
				method: "GET",
				credentials: "same-origin",
			});

			if (response.ok) {
				const blob = await response.blob();
				const objectUrl = URL.createObjectURL(blob);

				if (previewWindow) {
					previewWindow.location.href = objectUrl;
				} else {
					window.open(objectUrl, "_blank", "noopener,noreferrer");
				}

				window.setTimeout(() => {
					URL.revokeObjectURL(objectUrl);
				}, 60_000);

				return;
			}

			const payload = (await response.json().catch(() => null)) as {
				message?: string;
			} | null;

			if (response.status === 422) {
				previewWindow?.close();
				setIsContractBusinessErrorOpen(true);
				return;
			}

			previewWindow?.close();
			setContractError({
				status: response.status,
				message:
					payload?.message ??
					(response.status === 404
						? "No pudimos encontrar el pedido para generar el remito."
						: "No pudimos abrir el remito. Intenta nuevamente."),
			});
		} catch {
			previewWindow?.close();
			setContractError({
				status: 500,
				message: "No pudimos abrir el remito. Intenta nuevamente.",
			});
		} finally {
			setIsOpeningContract(false);
		}
	};

	const handleEditOrder = () => {
		// TODO: navigate to edit order page or open edit modal
	};

	const handleReleaseEquipment = () => {
		// TODO: trigger release equipment mutation, then invalidate order query
	};

	const handleProcessPayment = () => {
		// TODO: trigger process payment mutation, then invalidate order query
	};

	return {
		contractError,
		handleOpenContract,
		handleEditOrder,
		handleReleaseEquipment,
		handleProcessPayment,
		isContractBusinessErrorOpen,
		isOpeningContract,
		setContractError,
		setIsContractBusinessErrorOpen,
	};
}
