import type {
	CreateDraftOrderDto,
	DeliveryRequestDto,
} from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import type {
	DraftOrderItem,
	DraftOrderState,
} from "@/features/orders/draft-order/types/draft-order.types";

export function validateDraftOrderForSave({
	state,
	locationId,
}: {
	state: DraftOrderState;
	locationId: string | null;
}): string | null {
	if (!locationId) {
		return "Seleccioná una locación antes de guardar el borrador.";
	}

	if (
		!state.rentalPeriod.pickupDate ||
		!state.rentalPeriod.returnDate ||
		state.rentalPeriod.pickupTime === null ||
		state.rentalPeriod.returnTime === null
	) {
		return "Completá el periodo compartido antes de guardar el borrador.";
	}

	if (state.items.length === 0) {
		return "Agregá al menos un item antes de guardar el borrador.";
	}

	if (
		state.fulfillmentMethod === FulfillmentMethod.DELIVERY &&
		!isDeliveryRequestComplete(state.deliveryRequest)
	) {
		return "Completá el delivery request antes de guardar un borrador con entrega.";
	}

	return null;
}

export function buildCreateDraftOrderPayload({
	state,
	locationId,
}: {
	state: DraftOrderState;
	locationId: string;
}): CreateDraftOrderDto {
	return {
		customerId: state.customer?.id ?? null,
		locationId,
		pickupDate: state.rentalPeriod.pickupDate ?? "",
		returnDate: state.rentalPeriod.returnDate ?? "",
		pickupTime: state.rentalPeriod.pickupTime ?? 0,
		returnTime: state.rentalPeriod.returnTime ?? 0,
		currency: state.currency,
		insuranceSelected: false,
		initialPricingAdjustment: buildInitialPricingAdjustment(state),
		fulfillmentMethod: state.fulfillmentMethod,
		deliveryRequest: normalizeDeliveryRequest(
			state.fulfillmentMethod,
			state.deliveryRequest,
		),
		items: state.items.map((item) => toCreateDraftOrderItem(item)),
	};
}

function toCreateDraftOrderItem(item: DraftOrderItem): CreateDraftOrderDto["items"][number] {
	if (item.selection.type === "PRODUCT") {
		return {
			type: "PRODUCT",
			productTypeId: item.selection.productTypeId,
			assetId: item.selection.assetId,
			quantity: item.selection.quantity,
		};
	}

	return {
		type: "BUNDLE",
		bundleId: item.selection.bundleId,
	};
}

function buildInitialPricingAdjustment(
	state: DraftOrderState,
): CreateDraftOrderDto["initialPricingAdjustment"] {
	if (!state.budget || state.budget.targetTotal === state.budget.currentItemsSubtotal) {
		return null;
	}

	return {
		mode: "TARGET_TOTAL",
		targetTotal: state.budget.targetTotal,
	};
}

function normalizeDeliveryRequest(
	fulfillmentMethod: FulfillmentMethod,
	deliveryRequest: DraftOrderState["deliveryRequest"],
): DeliveryRequestDto | null {
	if (fulfillmentMethod !== FulfillmentMethod.DELIVERY || !deliveryRequest) {
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
}

function isDeliveryRequestComplete(
	deliveryRequest: DraftOrderState["deliveryRequest"],
): deliveryRequest is NonNullable<DraftOrderState["deliveryRequest"]> {
	if (!deliveryRequest) {
		return false;
	}

	return Boolean(
		deliveryRequest.recipientName.trim() &&
			deliveryRequest.phone.trim() &&
			deliveryRequest.addressLine1.trim() &&
			deliveryRequest.city.trim() &&
			deliveryRequest.stateRegion.trim() &&
			deliveryRequest.postalCode.trim() &&
			deliveryRequest.country.trim(),
	);
}
