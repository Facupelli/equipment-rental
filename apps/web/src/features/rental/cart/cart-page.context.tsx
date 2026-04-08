import { createContext, useContext } from "react";
import type {
  BookingSlice,
  CartPageContextValue,
  CartSlice,
  DeliverySlice,
  LocationSlice,
  PricingSlice,
  TimesSlice,
} from "@/features/rental/cart/cart-page.context.types";
import { useCartOrder } from "@/features/rental/cart/hooks/use-cart-order";
import { rentalLocationQueries } from "@/features/tenant/locations/locations.queries";
import { useSuspenseQuery } from "@tanstack/react-query";

const CartPageContext = createContext<CartPageContextValue | null>(null);

export function useCartPageContext(): CartPageContextValue {
  const ctx = useContext(CartPageContext);
  if (!ctx)
    throw new Error("useCartPageContext must be used inside CartPageProvider");
  return ctx;
}

export function useCartContext(): CartSlice {
  return useCartPageContext().cart;
}

export function useCartLocationContext(): LocationSlice {
  return useCartPageContext().location;
}

export function useCartPricingContext(): PricingSlice {
  return useCartPageContext().pricing;
}

export function useCartTimesContext(): TimesSlice {
  return useCartPageContext().times;
}

export function useCartDeliveryContext(): DeliverySlice {
  return useCartPageContext().delivery;
}

export function useCartBookingContext(): BookingSlice {
  return useCartPageContext().booking;
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
  const { data: locations } = useSuspenseQuery(rentalLocationQueries.list());
  const location = locations.find((l) => l.id === locationId);

  if (!location) {
    throw new Error(`Rental location not found for cart: ${locationId}`);
  }

  const cartOrder = useCartOrder({
    location: {
      id: location.id,
      name: location.name,
      supportsDelivery: location.supportsDelivery,
      deliveryDefaults: {
        country: location.deliveryDefaults?.country ?? "",
        stateRegion: location.deliveryDefaults?.stateRegion ?? "",
        city: location.deliveryDefaults?.city ?? "",
        postalCode: location.deliveryDefaults?.postalCode ?? "",
      },
    },
    startDate,
    endDate,
  });

  return (
    <CartPageContext.Provider value={cartOrder}>
      {children}
    </CartPageContext.Provider>
  );
}
