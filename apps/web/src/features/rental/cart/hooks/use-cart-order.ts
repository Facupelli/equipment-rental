import type { RentalLocationResponse } from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateOrder } from "@/features/orders/orders.queries";
import {
	useCartActions,
	useCartItems,
} from "@/features/rental/cart/cart.hooks";
import type { CartPageContextValue } from "@/features/rental/cart/cart-page.context.types";
import { PORTAL_AUTH_REDIRECT_ROUTES } from "../../auth/portal-auth.redirect";
import { useCurrentCustomer } from "../../customer/customer.queries";
import type { ConflictGroup } from "../cart.types";
import { formatSlot } from "../cart.utils";
import {
	extractBookingConflicts,
	isDeliveryNotSupportedError,
	isDeliveryRequestComplete,
} from "../cart-order.utils";
import { useCartOrderDelivery } from "./use-cart-order-delivery";
import { useCartOrderPricing } from "./use-cart-order-pricing";
import { useCartOrderTimes } from "./use-cart-order-times";

type UseCartOrderParams = {
	location: {
		id: string;
		name: string;
		supportsDelivery: boolean;
		deliveryDefaults: NonNullable<RentalLocationResponse["deliveryDefaults"]>;
	};
	pickupDate: string;
	returnDate: string;
};

/**
 * Owns all data-fetching and mutation logic for the cart page.
 *
 * Responsibilities:
 * - Own pickup/return time state and their change handlers
 * - Validate times before booking and expose the error state to the view
 * - Convert date-only route params to dayjs once (Layer 1 → Layer 2)
 * - Build the shared item payload (once, shared between preview + submit)
 * - Fetch the price preview
 * - Join line items with cart item names (so views don't touch the cart store)
 * - Submit the order and navigate on success
 * - Track unavailable item IDs on 422 errors
 * - Track unexpected booking errors (non-422) for inline error display
 */
export function useCartOrder({
	location,
	pickupDate,
	returnDate,
}: UseCartOrderParams) {
	const navigate = useNavigate();
	const { data: customer } = useCurrentCustomer();
	const cartItems = useCartItems();
	const { clearCart } = useCartActions();

	const [insuranceSelected, setInsuranceSelected] = useState(true);
	const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
	const [conflictGroups, setConflictGroups] = useState<ConflictGroup[]>([]);
	const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(
		null,
	);

	const onInsuranceSelectedChange = (value: boolean) => {
		setInsuranceSelected(value);
	};

	const times = useCartOrderTimes();
	const delivery = useCartOrderDelivery({
		supportsDelivery: location.supportsDelivery,
		deliveryDefaults: location.deliveryDefaults,
	});
	const pricing = useCartOrderPricing({
		locationId: location.id,
		pickupDate,
		returnDate,
		insuranceSelected,
		cartItems,
	});

	const { mutateAsync: createOrder } = useCreateOrder();

	const handleBook = async () => {
		setUnavailableIds([]);
		setConflictGroups([]);
		setBookingErrorMessage(null);

		if (!customer) {
			navigate({
				to: "/login",
				search: {
					redirectTo: PORTAL_AUTH_REDIRECT_ROUTES[1],
					locationId: location.id,
					pickupDate,
					returnDate,
				},
			});
			return;
		}

		if (!times.pickupTime || !times.returnTime) {
			times.requireTimes();
			return;
		}

		if (
			delivery.fulfillmentMethod === FulfillmentMethod.DELIVERY &&
			!isDeliveryRequestComplete(delivery.normalizedDeliveryRequest)
		) {
			delivery.requireDeliveryDetails();
			return;
		}

		try {
			await createOrder({
				locationId: location.id,
				pickupDate,
				returnDate,
				currency: "USD",
				items: pricing.itemPayload,
				insuranceSelected,
				fulfillmentMethod: delivery.fulfillmentMethod,
				deliveryRequest: delivery.normalizedDeliveryRequest,
				pickupTime: times.pickupTime,
				returnTime: times.returnTime,
			});

			clearCart();

			navigate({
				to: "/order-confirmation",
				search: {
					pickupDate: pricing.period.start.format("YYYY-MM-DD"),
					pickupLocation: location.name,
					pickupTime: formatSlot(times.pickupTime),
				},
			});
		} catch (error) {
			const conflicts = extractBookingConflicts(error);
			if (conflicts) {
				setUnavailableIds(conflicts.unavailableIds);
				setConflictGroups(conflicts.conflictGroups);
				return;
			}

			if (isDeliveryNotSupportedError(error)) {
				delivery.onFulfillmentMethodChange(FulfillmentMethod.PICKUP);
				setBookingErrorMessage(
					"Esta sucursal solo permite retiro en el local.",
				);
				return;
			}

			// Any non-422 error (5xx, network failure, etc.) — surface inline
			// without re-throwing, so the page stays intact and the user can retry.
			setBookingErrorMessage(
				"La reserva falló inesperadamente. Por favor, intentalo de nuevo.",
			);
		}
	};

	return {
		cart: {
			cartItems,
		},
		location: {
			locationId: location.id,
			locationName: location.name === "-" ? undefined : location.name,
			pickupDate,
			returnDate,
			period: pricing.period,
		},
		pricing: {
			breakdown: pricing.breakdown,
			joinedLineItems: pricing.joinedLineItems,
			insuranceSelected,
			onInsuranceSelectedChange,
			isPriceLoading: pricing.isPriceLoading,
			isPriceError: pricing.isPriceError,
		},
		times: {
			pickupTime: times.pickupTime,
			returnTime: times.returnTime,
			onPickupTimeChange: times.onPickupTimeChange,
			onReturnTimeChange: times.onReturnTimeChange,
			isTimesRequired: times.isTimesRequired,
		},
		delivery: {
			supportsDelivery: delivery.supportsDelivery,
			fulfillmentMethod: delivery.fulfillmentMethod,
			deliveryRequest: delivery.deliveryRequest,
			isDeliveryDetailsRequired: delivery.isDeliveryDetailsRequired,
			onFulfillmentMethodChange: delivery.onFulfillmentMethodChange,
			onDeliveryRequestFieldChange: delivery.onDeliveryRequestFieldChange,
		},
		booking: {
			isAuthenticated: Boolean(customer),
			isBookingError: Boolean(bookingErrorMessage),
			bookingErrorMessage,
			unavailableIds,
			conflictGroups,
			handleBook,
		},
	} satisfies CartPageContextValue;
}
