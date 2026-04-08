import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";

export function useOrderActions(order: ParsedOrderDetailResponseDto) {
	const handlePrintPdf = () => {
		// TODO: generate and download PDF for order
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
		handlePrintPdf,
		handleEditOrder,
		handleReleaseEquipment,
		handleProcessPayment,
	};
}
