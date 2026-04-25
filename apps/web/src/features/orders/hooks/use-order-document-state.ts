import { useState } from "react";
import type { ContractErrorState } from "../order-document.utils";

export function useOrderDocumentState() {
	const [contractError, setContractError] = useState<ContractErrorState>(null);
	const [contractBusinessErrorMessage, setContractBusinessErrorMessage] =
		useState<string | null>(null);
	const [isContractBusinessErrorOpen, setIsContractBusinessErrorOpen] =
		useState(false);

	return {
		contractError,
		setContractError,
		contractBusinessErrorMessage,
		setContractBusinessErrorMessage,
		isContractBusinessErrorOpen,
		setIsContractBusinessErrorOpen,
	};
}
