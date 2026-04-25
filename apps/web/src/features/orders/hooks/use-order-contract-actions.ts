import { useState } from "react";
import {
	type ContractErrorState,
	openPreviewWindow,
	preflightContractRequest,
} from "../order-document.utils";

type UseOrderContractActionsParams = {
	orderId: string;
	setContractError: (value: ContractErrorState) => void;
	setContractBusinessErrorMessage: (value: string | null) => void;
	setIsContractBusinessErrorOpen: (value: boolean) => void;
};

export function useOrderContractActions({
	orderId,
	setContractError,
	setContractBusinessErrorMessage,
	setIsContractBusinessErrorOpen,
}: UseOrderContractActionsParams) {
	const [isOpeningContract, setIsOpeningContract] = useState(false);
	const [isDownloadingContract, setIsDownloadingContract] = useState(false);

	const handleOpenContract = async () => {
		const previewWindow = openPreviewWindow();

		setIsOpeningContract(true);
		setContractError(null);

		const contractUrl = `/api/orders/${orderId}/contract/`;
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

		const downloadUrl = `/api/orders/${orderId}/contract/download`;
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

	return {
		isOpeningContract,
		isDownloadingContract,
		handleOpenContract,
		handleDownloadContract,
	};
}
