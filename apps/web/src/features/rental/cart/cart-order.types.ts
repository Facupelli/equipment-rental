import type { CartPriceLineItem } from "@repo/schemas";
import type { Dayjs } from "dayjs";

export type CartOrderPeriod = {
	start: Dayjs;
	end: Dayjs;
};

export type JoinedLineItem = CartPriceLineItem & { name: string };

export type DeliveryRequestFormState = {
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

export type DeliveryDefaultsFormState = Pick<
	DeliveryRequestFormState,
	"country" | "stateRegion" | "city" | "postalCode"
>;

export type DeliveryRequestField = keyof DeliveryRequestFormState;

export const EMPTY_DELIVERY_REQUEST: DeliveryRequestFormState = {
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
