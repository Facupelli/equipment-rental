import { createContext, useContext } from "react";
import { useCartOrder } from "@/features/rental/cart/hooks/use-cart-order";
import { useRentalLocations } from "@/features/tenant/locations/locations.queries";

type CartPageContextValue = ReturnType<typeof useCartOrder> & {
	locationName: string | undefined;
	startDate: Date;
	endDate: Date;
	locationId: string;
};

const CartPageContext = createContext<CartPageContextValue | null>(null);

export function useCartPageContext(): CartPageContextValue {
	const ctx = useContext(CartPageContext);
	if (!ctx)
		throw new Error("useCartPageContext must be used inside CartPageProvider");
	return ctx;
}

type CartPageProviderProps = {
	children: React.ReactNode;
	startDate: Date;
	endDate: Date;
	locationId: string;
};

export function CartPageProvider({
	children,
	startDate,
	endDate,
	locationId,
}: CartPageProviderProps) {
	const { data: locations } = useRentalLocations();
	const location = locations?.find((l) => l.id === locationId);

	const cartOrder = useCartOrder({
		location: {
			id: locationId,
			name: location?.name ?? "-",
		},
		startDate,
		endDate,
	});

	return (
		<CartPageContext.Provider
			value={{
				...cartOrder,
				locationId,
				locationName: location?.name,
				startDate,
				endDate,
			}}
		>
			{children}
		</CartPageContext.Provider>
	);
}
