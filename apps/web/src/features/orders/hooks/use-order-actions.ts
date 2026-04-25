import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";
import { useOrderBudgetActions } from "./use-order-budget-actions";
import { useOrderCancelActions } from "./use-order-cancel-actions";
import { useOrderConfirmActions } from "./use-order-confirm-actions";
import { useOrderContractActions } from "./use-order-contract-actions";
import { useOrderDocumentState } from "./use-order-document-state";
import { useOrderLifecycleActions } from "./use-order-lifecycle-actions";

export function useOrderActions(order: ParsedOrderDetailResponseDto) {
	const documentState = useOrderDocumentState();
	const contractActions = useOrderContractActions({
		orderId: order.id,
		setContractError: documentState.setContractError,
		setContractBusinessErrorMessage:
			documentState.setContractBusinessErrorMessage,
		setIsContractBusinessErrorOpen:
			documentState.setIsContractBusinessErrorOpen,
	});
	const budgetActions = useOrderBudgetActions({
		order,
		setContractError: documentState.setContractError,
		setContractBusinessErrorMessage:
			documentState.setContractBusinessErrorMessage,
		setIsContractBusinessErrorOpen:
			documentState.setIsContractBusinessErrorOpen,
	});
	const confirmActions = useOrderConfirmActions(order);
	const cancelActions = useOrderCancelActions(order.id);
	const lifecycleActions = useOrderLifecycleActions(order.id);

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
		documents: {
			contract: {
				isOpening: contractActions.isOpeningContract,
				isDownloading: contractActions.isDownloadingContract,
				open: contractActions.handleOpenContract,
				download: contractActions.handleDownloadContract,
			},
			error: {
				contractError: documentState.contractError,
				setContractError: documentState.setContractError,
				businessMessage: documentState.contractBusinessErrorMessage,
				setBusinessMessage: documentState.setContractBusinessErrorMessage,
				isBusinessErrorOpen: documentState.isContractBusinessErrorOpen,
				setIsBusinessErrorOpen:
					documentState.setIsContractBusinessErrorOpen,
			},
		},
		budget: {
			isOpening: budgetActions.isOpeningBudget,
			isDownloading: budgetActions.isDownloadingBudget,
			open: budgetActions.handleOpenBudget,
			download: budgetActions.handleDownloadBudget,
			customerDialog: {
				intent: budgetActions.budgetDocumentIntent,
				open: budgetActions.isBudgetCustomerDialogOpen,
				onOpenChange: budgetActions.handleBudgetCustomerDialogOpenChange,
				submit: budgetActions.handleSubmitBudgetCustomer,
			},
		},
		confirmation: {
			isDialogOpen: confirmActions.isConfirmOrderDialogOpen,
			setIsDialogOpen: confirmActions.setIsConfirmOrderDialogOpen,
			error: confirmActions.confirmOrderError,
			isPending: confirmActions.isConfirmOrderPending,
			openDialog: confirmActions.handleConfirmOrder,
			submit: confirmActions.handleConfirmOrderSubmission,
		},
		cancellation: {
			isDialogOpen: cancelActions.isCancelOrderDialogOpen,
			setIsDialogOpen: cancelActions.setIsCancelOrderDialogOpen,
			error: cancelActions.cancelOrderError,
			isPending: cancelActions.isCancelOrderPending,
			openDialog: cancelActions.handleOpenCancelOrder,
			submit: cancelActions.handleConfirmCancelOrder,
		},
		lifecycle: {
			pendingAction: lifecycleActions.pendingLifecycleAction,
			isPending: lifecycleActions.isLifecycleActionPending,
			error: lifecycleActions.lifecycleActionError,
			setDialogOpen: lifecycleActions.setIsLifecycleActionDialogOpen,
			openPickup: lifecycleActions.handleMarkAsPickedUp,
			openReturn: lifecycleActions.handleMarkAsReturned,
			submit: lifecycleActions.handleConfirmLifecycleAction,
		},
		edit: {
			open: handleEditOrder,
		},
		operations: {
			processPayment: handleProcessPayment,
			releaseEquipment: handleReleaseEquipment,
		},
	};
}
