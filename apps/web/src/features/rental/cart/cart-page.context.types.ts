import type { CartPriceResult } from "@repo/schemas";
import type { FulfillmentMethod } from "@repo/types";
import type {
	DeliveryRequestField,
	DeliveryRequestFormState,
	JoinedLineItem,
	CartOrderPeriod,
} from "./cart-order.types";
import type { CartItem, ConflictGroup } from "./cart.types";

export type CartSlice = {
	cartItems: CartItem[];
};

export type LocationSlice = {
	locationId: string;
	locationName: string | undefined;
	startDate: Date;
	endDate: Date;
	period: CartOrderPeriod;
};

export type PricingSlice = {
	breakdown: CartPriceResult | undefined;
	joinedLineItems: JoinedLineItem[] | undefined;
	insuranceSelected: boolean;
	onInsuranceSelectedChange: (value: boolean) => void;
	isPriceLoading: boolean;
	isPriceError: boolean;
};

export type TimesSlice = {
	pickupTime: number | undefined;
	returnTime: number | undefined;
	onPickupTimeChange: (value: number) => void;
	onReturnTimeChange: (value: number) => void;
	isTimesRequired: boolean;
};

export type DeliverySlice = {
	fulfillmentMethod: FulfillmentMethod;
	deliveryRequest: DeliveryRequestFormState;
	isDeliveryDetailsRequired: boolean;
	onFulfillmentMethodChange: (value: FulfillmentMethod) => void;
	onDeliveryRequestFieldChange: (
		field: DeliveryRequestField,
		value: string,
	) => void;
};

export type BookingSlice = {
	isAuthenticated: boolean;
	isBookingError: boolean;
	unavailableIds: string[];
	conflictGroups: ConflictGroup[];
	handleBook: () => Promise<void>;
};

export type CartPageContextValue = {
	cart: CartSlice;
	location: LocationSlice;
	pricing: PricingSlice;
	times: TimesSlice;
	delivery: DeliverySlice;
	booking: BookingSlice;
};
