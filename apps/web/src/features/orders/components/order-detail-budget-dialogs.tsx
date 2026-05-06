import { OrderBudgetCustomerDialog } from "@/features/orders/components/order-budget-customer-dialog";
import { useOrderBudget } from "@/features/orders/contexts/order-detail.context";

export function OrderDetailBudgetDialogs() {
	const budget = useOrderBudget();

	return (
		<OrderBudgetCustomerDialog
			open={budget.customerDialog.open}
			onOpenChange={budget.customerDialog.onOpenChange}
			onSubmit={budget.customerDialog.submit}
			isOpeningBudget={budget.isOpening}
		/>
	);
}
