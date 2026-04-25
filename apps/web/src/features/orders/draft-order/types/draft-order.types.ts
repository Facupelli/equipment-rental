import type {
	DeliveryRequestDto,
	DraftOrderDiscountLine,
} from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";

export type DraftOrderCustomerRef = {
	id: string;
	displayName: string;
};

export type DraftOrderRentalPeriod = {
	pickupDate: string | null;
	returnDate: string | null;
	pickupTime: number | null;
	returnTime: number | null;
};

export type DraftOrderDeliveryRequestDraft = Omit<
	DeliveryRequestDto,
	"addressLine2" | "instructions"
> & {
	addressLine2: string;
	instructions: string;
};

export type DraftOrderPricingSnapshot = {
	currency: string;
	basePrice: string;
	finalPrice: string;
	discountTotal: string;
	discountLines: DraftOrderDiscountLine[];
};

export type DraftOrderItemBudgetPreview = {
	draftItemId: string;
	label: string;
	currency: string;
	basePrice: string;
	currentFinalPrice: string;
	proposedFinalPrice: string;
	proposedDiscountAmount: string;
};

export type DraftOrderSelectedProductItem = {
	type: "PRODUCT";
	productTypeId: string;
	assetId?: string;
	quantity: number;
	label: string;
};

export type DraftOrderSelectedBundleItem = {
	type: "BUNDLE";
	bundleId: string;
	label: string;
};

export type DraftOrderSelectedItem =
	| DraftOrderSelectedProductItem
	| DraftOrderSelectedBundleItem;

export type DraftOrderItem = {
	draftItemId: string;
	selection: DraftOrderSelectedItem;
	pricingSnapshot: DraftOrderPricingSnapshot;
	budgetPreview: DraftOrderItemBudgetPreview | null;
};

export type DraftOrderBudgetState = {
	currency: string;
	currentItemsSubtotal: string;
	targetTotal: string;
	proposedDiscountTotal: string;
	items: DraftOrderItemBudgetPreview[];
};

export type DraftOrderState = {
	currency: string;
	customer: DraftOrderCustomerRef | null;
	rentalPeriod: DraftOrderRentalPeriod;
	fulfillmentMethod: FulfillmentMethod;
	deliveryRequest: DraftOrderDeliveryRequestDraft | null;
	items: DraftOrderItem[];
	budget: DraftOrderBudgetState | null;
};

export const EMPTY_DRAFT_ORDER_RENTAL_PERIOD: DraftOrderRentalPeriod = {
	pickupDate: null,
	returnDate: null,
	pickupTime: null,
	returnTime: null,
};

export const EMPTY_DRAFT_ORDER_DELIVERY_REQUEST: DraftOrderDeliveryRequestDraft = {
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
