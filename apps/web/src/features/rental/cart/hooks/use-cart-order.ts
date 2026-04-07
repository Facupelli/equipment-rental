import type {
	CalculateCartPricesRequest,
	CartPriceLineItem,
	DeliveryRequestDto,
} from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import { useNavigate } from "@tanstack/react-router";
import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { useCreateOrder } from "@/features/orders/orders.queries";
import {
	useCartActions,
	useCartItems,
} from "@/features/rental/cart/cart.hooks";
import { useCartPricePreview } from "@/features/rental/rental.queries";
import { fromDate, toISOString } from "@/lib/dates/parse";
import { ProblemDetailsError } from "@/shared/errors";
import { PORTAL_AUTH_REDIRECT_ROUTES } from "../../auth/portal-auth.redirect";
import { useCurrentCustomer } from "../../customer/customer.queries";
import type { ConflictGroup } from "../cart.types";
import { formatSlot } from "../cart.utils";

type UseCartOrderParams = {
	location: {
		id: string;
		name: string;
	};
	startDate: Date;
	endDate: Date;
};

export type CartOrderPeriod = {
	start: Dayjs;
	end: Dayjs;
};

// Line item enriched with the cart item's display name.
// Computed here because this hook already owns both cartItems and breakdown —
// the page component shouldn't need to know about either to render the sidebar.
export type JoinedLineItem = CartPriceLineItem & { name: string };

type DeliveryRequestFormState = {
	recipientName: string;
	phone: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	stateRegion: string;
	postalCode: string;
	country: string;
	instructions: string;
};

const EMPTY_DELIVERY_REQUEST: DeliveryRequestFormState = {
	recipientName: "",
	phone: "",
	addressLine1: "",
	addressLine2: "",
	city: "",
	stateRegion: "",
	postalCode: "",
	country: "",
	instructions: "",
};

/**
 * Owns all data-fetching and mutation logic for the cart page.
 *
 * Responsibilities:
 * - Own pickup/return time state and their change handlers
 * - Validate times before booking and expose the error state to the view
 * - Convert native Date params to dayjs once (Layer 1 → Layer 2)
 * - Build the shared item payload (once, shared between preview + submit)
 * - Fetch the price preview
 * - Join line items with cart item names (so views don't touch the cart store)
 * - Submit the order and navigate on success
 * - Track unavailable item IDs on 422 errors
 * - Track unexpected booking errors (non-422) for inline error display
 */
export function useCartOrder({
	location,
	startDate,
	endDate,
}: UseCartOrderParams) {
	const navigate = useNavigate();
	const { data: customer } = useCurrentCustomer();
	const cartItems = useCartItems();
	const { clearCart } = useCartActions();

	const [pickupTime, setPickupTime] = useState<number | undefined>(undefined);
	const [returnTime, setReturnTime] = useState<number | undefined>(undefined);
	const [insuranceSelected, setInsuranceSelected] = useState(true);
	const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>(
		FulfillmentMethod.PICKUP,
	);
	const [deliveryRequest, setDeliveryRequest] =
		useState<DeliveryRequestFormState>(EMPTY_DELIVERY_REQUEST);
	const [isTimesRequired, setIsTimesRequired] = useState(false);
	const [isDeliveryDetailsRequired, setIsDeliveryDetailsRequired] =
		useState(false);
	const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
	const [conflictGroups, setConflictGroups] = useState<ConflictGroup[]>([]);
	const [isBookingError, setIsBookingError] = useState(false);

	const onPickupTimeChange = (value: number) => {
		setPickupTime(value);
		if (value && returnTime) setIsTimesRequired(false);
	};

	const onReturnTimeChange = (value: number) => {
		setReturnTime(value);
		if (pickupTime && value) setIsTimesRequired(false);
	};

	const onInsuranceSelectedChange = (value: boolean) => {
		setInsuranceSelected(value);
	};

	const onFulfillmentMethodChange = (value: FulfillmentMethod) => {
		setFulfillmentMethod(value);
		if (value === FulfillmentMethod.PICKUP) {
			setIsDeliveryDetailsRequired(false);
		}
	};

	const onDeliveryRequestFieldChange = (
		field: keyof DeliveryRequestFormState,
		value: string,
	) => {
		setDeliveryRequest((current) => ({ ...current, [field]: value }));
		setIsDeliveryDetailsRequired(false);
	};

	// Layer boundary: native Date → dayjs, once.
	// All downstream logic and transport use these dayjs instances.
	const period: CartOrderPeriod = useMemo(
		() => ({ start: fromDate(startDate), end: fromDate(endDate) }),
		[startDate, endDate],
	);

	// Built once — reused for both the price preview query and the order mutation.
	const itemPayload = useMemo(
		() =>
			cartItems.map((item) =>
				item.type === "PRODUCT"
					? {
							type: "PRODUCT" as const,
							productTypeId: item.productTypeId,
							quantity: item.quantity,
						}
					: {
							type: "BUNDLE" as const,
							bundleId: item.bundleId,
							quantity: item.quantity,
						},
			),
		[cartItems],
	);

	const pricePreviewRequest: CalculateCartPricesRequest = {
		currency: "USD",
		locationId: location.id,
		period: {
			start: toISOString(period.start),
			end: toISOString(period.end),
		},
		items: itemPayload,
		insuranceSelected,
	};

	const {
		data: breakdown,
		isPending: isPriceLoading,
		isError: isPriceError,
	} = useCartPricePreview(pricePreviewRequest, {
		enabled: Boolean(startDate && endDate && location.id),
	});

	// Pre-join line items with cart item names so downstream components
	// don't need to know about the cart store or the breakdown shape.
	const joinedLineItems: JoinedLineItem[] | undefined = useMemo(
		() =>
			breakdown?.lineItems.map((line) => {
				const cartItem = cartItems.find(
					(i) =>
						(i.type === "PRODUCT" && i.productTypeId === line.id) ||
						(i.type === "BUNDLE" && i.bundleId === line.id),
				);
				return { ...line, name: cartItem?.name ?? line.id };
			}),
		[breakdown, cartItems],
	);

	const { mutateAsync: createOrder } = useCreateOrder();

	const normalizedDeliveryRequest = useMemo<DeliveryRequestDto | null>(() => {
		if (fulfillmentMethod !== FulfillmentMethod.DELIVERY) {
			return null;
		}

		return {
			recipientName: deliveryRequest.recipientName.trim(),
			phone: deliveryRequest.phone.trim(),
			addressLine1: deliveryRequest.addressLine1.trim(),
			addressLine2: deliveryRequest.addressLine2.trim() || null,
			city: deliveryRequest.city.trim(),
			stateRegion: deliveryRequest.stateRegion.trim(),
			postalCode: deliveryRequest.postalCode.trim(),
			country: deliveryRequest.country.trim(),
			instructions: deliveryRequest.instructions.trim() || null,
		};
	}, [deliveryRequest, fulfillmentMethod]);

	const handleBook = async () => {
		setUnavailableIds([]);
		setIsBookingError(false);

		if (!customer) {
			navigate({
				to: "/login",
				search: {
					redirectTo: PORTAL_AUTH_REDIRECT_ROUTES[1],
					locationId: location.id,
					startDate,
					endDate,
				},
			});
			return;
		}

		if (!pickupTime || !returnTime) {
			setIsTimesRequired(true);
			return;
		}

		if (
			fulfillmentMethod === FulfillmentMethod.DELIVERY &&
			(!normalizedDeliveryRequest?.recipientName ||
				!normalizedDeliveryRequest.phone ||
				!normalizedDeliveryRequest.addressLine1 ||
				!normalizedDeliveryRequest.city ||
				!normalizedDeliveryRequest.stateRegion ||
				!normalizedDeliveryRequest.postalCode ||
				!normalizedDeliveryRequest.country)
		) {
			setIsDeliveryDetailsRequired(true);
			return;
		}

		try {
			await createOrder({
				locationId: location.id,
				periodStart: toISOString(period.start),
				periodEnd: toISOString(period.end),
				currency: "USD",
				items: itemPayload,
				insuranceSelected,
				fulfillmentMethod,
				deliveryRequest: normalizedDeliveryRequest,
				pickupTime,
				returnTime,
			});

			clearCart();

			navigate({
				to: "/order-confirmation",
				search: {
					pickupDate: period.start.format("YYYY-MM-DD"),
					pickupLocation: location.name,
					pickupTime: formatSlot(pickupTime),
				},
			});
		} catch (error) {
			if (
				error instanceof ProblemDetailsError &&
				error.problemDetails.status === 422
			) {
				const ids = (error.problemDetails.unavailableItems ?? []).map(
					(i: { productTypeId?: string; bundleId?: string }) =>
						i.productTypeId ?? i.bundleId ?? "",
				);
				setUnavailableIds(ids.filter(Boolean));

				const groups: ConflictGroup[] =
					error.problemDetails.conflictGroups ?? [];
				setConflictGroups(groups);

				return;
			}

			// Any non-422 error (5xx, network failure, etc.) — surface inline
			// without re-throwing, so the page stays intact and the user can retry.
			setIsBookingError(true);
		}
	};

	return {
		cartItems,
		period,
		breakdown,
		joinedLineItems,
		insuranceSelected,
		fulfillmentMethod,
		deliveryRequest,
		isAuthenticated: Boolean(customer),
		pickupTime,
		returnTime,
		onInsuranceSelectedChange,
		onFulfillmentMethodChange,
		onDeliveryRequestFieldChange,
		onPickupTimeChange,
		onReturnTimeChange,
		isTimesRequired,
		isDeliveryDetailsRequired,
		isPriceLoading,
		isPriceError,
		isBookingError,
		unavailableIds,
		conflictGroups,
		handleBook,
	};
}
