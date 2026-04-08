import { createContext, useContext } from "react";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";
import { useOrderActions } from "../hooks/use-order-actions";

type OrderDetailContextValue = {
	order: ParsedOrderDetailResponseDto;
	actions: ReturnType<typeof useOrderActions>;
};

const OrderDetailContext = createContext<OrderDetailContextValue | null>(null);

export function OrderDetailProvider({
	order,
	children,
}: {
	order: ParsedOrderDetailResponseDto;
	children: React.ReactNode;
}) {
	const actions = useOrderActions(order);

	return (
		<OrderDetailContext.Provider value={{ order, actions }}>
			{children}
		</OrderDetailContext.Provider>
	);
}

export function useOrderDetailContext(): OrderDetailContextValue {
	const ctx = useContext(OrderDetailContext);

	if (!ctx) {
		throw new Error(
			"useOrderDetailContext must be used within an OrderDetailProvider",
		);
	}

	return ctx;
}
