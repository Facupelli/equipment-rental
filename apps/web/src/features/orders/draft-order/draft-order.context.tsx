import { FulfillmentMethod } from "@repo/types";
import { createContext, useContext } from "react";
import { useDraftOrder } from "@/features/orders/draft-order/hooks/use-draft-order";
import type {
	DraftOrderCustomerRef,
	DraftOrderPricingSnapshot,
	DraftOrderSelectedBundleItem,
	DraftOrderSelectedProductItem,
	DraftOrderState,
} from "@/features/orders/draft-order/types/draft-order.types";

type DraftOrderContextValue = ReturnType<typeof useDraftOrder>;

const DraftOrderContext = createContext<DraftOrderContextValue | null>(null);

export function DraftOrderProvider({
	children,
	initialOrder,
}: {
	children: React.ReactNode;
	initialOrder?: DraftOrderState | null;
}) {
	const value = useDraftOrder(initialOrder);

	return (
		<DraftOrderContext.Provider value={value}>
			{children}
		</DraftOrderContext.Provider>
	);
}

export function useDraftOrderContext(): DraftOrderContextValue {
	const ctx = useContext(DraftOrderContext);

	if (!ctx) {
		throw new Error(
			"useDraftOrderContext must be used within a DraftOrderProvider",
		);
	}

	return ctx;
}

export function useDraftOrderCustomer() {
	const { state, actions } = useDraftOrderContext();

	return {
		customer: state.customer,
		setCustomer: actions.setCustomer,
		setCustomerField: actions.setCustomerField,
		clearCustomer: () => actions.setCustomer(null),
	} satisfies {
		customer: DraftOrderCustomerRef | null;
		setCustomer: (customer: DraftOrderCustomerRef | null) => void;
		setCustomerField: (
			field: keyof DraftOrderCustomerRef,
			value: string,
		) => void;
		clearCustomer: () => void;
	};
}

export function useDraftOrderRentalPeriod() {
	const { state, actions } = useDraftOrderContext();

	return {
		rentalPeriod: state.rentalPeriod,
		setRentalPeriodField: actions.setRentalPeriodField,
		clearRentalPeriod: () => {
			actions.setRentalPeriodField("pickupDate", null);
			actions.setRentalPeriodField("returnDate", null);
			actions.setRentalPeriodField("pickupTime", null);
			actions.setRentalPeriodField("returnTime", null);
		},
	};
}

export function useDraftOrderFulfillment() {
	const { state, actions } = useDraftOrderContext();

	return {
		fulfillmentMethod: state.fulfillmentMethod,
		deliveryRequest: state.deliveryRequest,
		setFulfillmentMethod: actions.setFulfillmentMethod,
		setDeliveryRequestField: actions.setDeliveryRequestField,
		switchToPickup: () =>
			actions.setFulfillmentMethod(FulfillmentMethod.PICKUP),
		switchToDelivery: () =>
			actions.setFulfillmentMethod(FulfillmentMethod.DELIVERY),
	};
}

export function useDraftOrderItems() {
	const { state, actions } = useDraftOrderContext();

	return {
		items: state.items,
		addPricedProductItem: actions.addPricedProductItem,
		addPricedBundleItem: actions.addPricedBundleItem,
		removeItem: actions.removeItem,
	};
}

export type AddPricedProductItemInput = {
	selection: DraftOrderSelectedProductItem;
	pricingSnapshot: DraftOrderPricingSnapshot;
};

export type AddPricedBundleItemInput = {
	selection: DraftOrderSelectedBundleItem;
	pricingSnapshot: DraftOrderPricingSnapshot;
};

export function useDraftOrderPricing() {
	const { state, actions, derived } = useDraftOrderContext();

	return {
		currency: state.currency,
		budget: state.budget,
		pricingByItemId: derived.pricingByItemId,
		totals: derived.totals,
		setBudgetTargetTotal: actions.setBudgetTargetTotal,
	};
}

export function useDraftOrderActions() {
	const { actions, derived, state } = useDraftOrderContext();

	return {
		resetDraft: actions.resetDraft,
		isReadyForSave: derived.hasRentalPeriod && derived.hasItems,
		itemCount: state.items.length,
	};
}

export type { DraftOrderState };
