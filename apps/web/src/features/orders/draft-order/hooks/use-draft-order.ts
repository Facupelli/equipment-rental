import type { DraftOrderDiscountLine } from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import { useReducer } from "react";
import type {
	DraftOrderCustomerRef,
	DraftOrderItem,
	DraftOrderPricingSnapshot,
	DraftOrderProposalPricingState,
	DraftOrderSelectedBundleItem,
	DraftOrderSelectedProductItem,
	DraftOrderState,
} from "@/features/orders/draft-order/types/draft-order.types";
import {
	EMPTY_DRAFT_ORDER_DELIVERY_REQUEST,
	EMPTY_DRAFT_ORDER_RENTAL_PERIOD,
} from "@/features/orders/draft-order/types/draft-order.types";
import {
	fromMoneyCents,
	getEffectiveFinalPrice,
	getManualAdjustmentAmount,
	getManualAdjustmentDirection,
	normalizeMoneyAmount,
	toMoneyCents,
} from "@/features/orders/draft-order/utils/draft-order-pricing";

type DraftOrderAction =
	| { type: "set_customer"; customer: DraftOrderCustomerRef | null }
	| {
			type: "set_customer_field";
			field: keyof DraftOrderCustomerRef;
			value: string;
	  }
	| {
			type: "set_rental_period_field";
			field: keyof DraftOrderState["rentalPeriod"];
			value: string | number | null;
	  }
	| {
			type: "set_fulfillment_method";
			fulfillmentMethod: FulfillmentMethod;
	  }
	| {
			type: "set_delivery_request_field";
			field: keyof NonNullable<DraftOrderState["deliveryRequest"]>;
			value: string;
	  }
	| {
			type: "add_item";
			item: DraftOrderItem;
	  }
	| { type: "remove_item"; draftItemId: string }
	| {
			type: "set_item_manual_override";
			draftItemId: string;
			finalPrice: string | null;
			reason?: string;
	  }
	| {
			type: "set_proposal_pricing";
			proposalPricing: DraftOrderProposalPricingState | null;
	  }
	| { type: "reset" };

export function createInitialDraftOrderState(): DraftOrderState {
	return {
		currency: "USD",
		customer: null,
		rentalPeriod: EMPTY_DRAFT_ORDER_RENTAL_PERIOD,
		fulfillmentMethod: FulfillmentMethod.PICKUP,
		deliveryRequest: null,
		items: [],
		proposalPricing: null,
	};
}

function clearProposalState(state: DraftOrderState): DraftOrderState {
	return {
		...state,
		items: state.items.map((item) => ({ ...item, proposalPricing: null })),
		proposalPricing: null,
	};
}

function draftOrderReducer(
	state: DraftOrderState,
	action: DraftOrderAction,
): DraftOrderState {
	switch (action.type) {
		case "set_customer":
			return { ...state, customer: action.customer };

		case "set_customer_field":
			return {
				...state,
				customer: {
					id: state.customer?.id ?? crypto.randomUUID(),
					displayName: state.customer?.displayName ?? "",
					[action.field]: action.value,
				},
			};

		case "set_rental_period_field":
			return {
				...state,
				rentalPeriod: {
					...state.rentalPeriod,
					[action.field]: action.value,
				},
			};

		case "set_fulfillment_method":
			return action.fulfillmentMethod === FulfillmentMethod.PICKUP
				? {
						...state,
						fulfillmentMethod: action.fulfillmentMethod,
						deliveryRequest: null,
					}
				: {
						...state,
						fulfillmentMethod: action.fulfillmentMethod,
						deliveryRequest:
							state.deliveryRequest ?? EMPTY_DRAFT_ORDER_DELIVERY_REQUEST,
					};

		case "set_delivery_request_field":
			return {
				...state,
				deliveryRequest: {
					...(state.deliveryRequest ?? EMPTY_DRAFT_ORDER_DELIVERY_REQUEST),
					[action.field]: action.value,
				},
			};

		case "add_item":
			return clearProposalState({
				...state,
				currency: action.item.pricingSnapshot.currency,
				items: [...state.items, action.item],
			});

		case "remove_item":
			return clearProposalState({
				...state,
				items: state.items.filter(
					(item) => item.draftItemId !== action.draftItemId,
				),
			});

		case "set_item_manual_override": {
			const normalizedFinalPrice =
				action.finalPrice === null
					? null
					: normalizeMoneyAmount(action.finalPrice);

			if (action.finalPrice !== null && normalizedFinalPrice === null) {
				return state;
			}

			return clearProposalState({
				...state,
				items: state.items.map((item) =>
					item.draftItemId === action.draftItemId
						? {
								...item,
								manualOverride:
									normalizedFinalPrice === null ||
									normalizedFinalPrice === item.pricingSnapshot.finalPrice
										? null
										: {
												finalPrice: normalizedFinalPrice,
												reason: action.reason,
											},
							}
						: item,
				),
			});
		}

		case "set_proposal_pricing": {
			const proposalItemsById = new Map(
				action.proposalPricing?.items.map((item) => [item.orderItemId, item]) ??
					[],
			);

			return {
				...state,
				proposalPricing: action.proposalPricing,
				items: state.items.map((item) => ({
					...item,
					proposalPricing: proposalItemsById.get(item.draftItemId) ?? null,
				})),
			};
		}

		case "reset":
			return createInitialDraftOrderState();

		default:
			return state;
	}
}

function createDraftItem(
	selection: DraftOrderSelectedProductItem | DraftOrderSelectedBundleItem,
	pricing: DraftOrderPricingSnapshot,
): DraftOrderItem {
	return {
		draftItemId: crypto.randomUUID(),
		selection,
		pricingSnapshot: pricing,
		manualOverride: null,
		proposalPricing: null,
	};
}

function createPricingSnapshot({
	currency,
	basePrice,
	finalPrice,
	discountTotal = "0.00",
	discountLines = [],
}: {
	currency: string;
	basePrice: string;
	finalPrice: string;
	discountTotal?: string;
	discountLines?: DraftOrderDiscountLine[];
}): DraftOrderPricingSnapshot {
	return {
		currency,
		basePrice,
		finalPrice,
		discountTotal,
		discountLines,
	};
}

export function useDraftOrder() {
	const [state, dispatch] = useReducer(
		draftOrderReducer,
		undefined,
		createInitialDraftOrderState,
	);
	const calculatedSubtotalCents = state.items.reduce((sum, item) => {
		return sum + (toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0);
	}, 0);
	const effectiveSubtotalCents = state.items.reduce((sum, item) => {
		return sum + (toMoneyCents(getEffectiveFinalPrice(item)) ?? 0);
	}, 0);
	const manualAdjustmentDeltaCents =
		effectiveSubtotalCents - calculatedSubtotalCents;

	return {
		state,
		derived: {
			totals: {
				calculatedSubtotal: fromMoneyCents(calculatedSubtotalCents),
				effectiveSubtotal: fromMoneyCents(effectiveSubtotalCents),
				proposalSubtotal: state.proposalPricing?.targetTotal ?? null,
				manualAdjustmentTotal: fromMoneyCents(
					Math.abs(manualAdjustmentDeltaCents),
				),
				manualAdjustmentDirection:
					manualAdjustmentDeltaCents < 0
						? "DISCOUNT"
						: manualAdjustmentDeltaCents > 0
							? "SURCHARGE"
							: ("NONE" as "DISCOUNT" | "SURCHARGE" | "NONE"),
				hasManualOverrides: state.items.some(
					(item) => item.manualOverride !== null,
				),
				manualOverrideCount: state.items.filter(
					(item) => item.manualOverride !== null,
				).length,
				hasProposalPricing: Boolean(state.proposalPricing),
			},
			pricingByItemId: Object.fromEntries(
				state.items.map((item) => [
					item.draftItemId,
					{
						effectiveFinalPrice: getEffectiveFinalPrice(item),
						manualAdjustmentAmount: getManualAdjustmentAmount(item),
						manualAdjustmentDirection: getManualAdjustmentDirection(item),
						isManualOverrideActive: item.manualOverride !== null,
					},
				]),
			),
			hasCustomer: Boolean(state.customer),
			hasRentalPeriod: Boolean(
				state.rentalPeriod.pickupDate &&
					state.rentalPeriod.returnDate &&
					state.rentalPeriod.pickupTime !== null &&
					state.rentalPeriod.returnTime !== null,
			),
			hasItems: state.items.length > 0,
		},
		actions: {
			setCustomer: (customer: DraftOrderCustomerRef | null) =>
				dispatch({ type: "set_customer", customer }),
			setCustomerField: (field: keyof DraftOrderCustomerRef, value: string) =>
				dispatch({ type: "set_customer_field", field, value }),
			setRentalPeriodField: (
				field: keyof DraftOrderState["rentalPeriod"],
				value: string | number | null,
			) => dispatch({ type: "set_rental_period_field", field, value }),
			setFulfillmentMethod: (fulfillmentMethod: FulfillmentMethod) =>
				dispatch({
					type: "set_fulfillment_method",
					fulfillmentMethod,
				}),
			setDeliveryRequestField: (
				field: keyof NonNullable<DraftOrderState["deliveryRequest"]>,
				value: string,
			) => dispatch({ type: "set_delivery_request_field", field, value }),
			addPricedProductItem: ({
				selection,
				pricingSnapshot,
			}: {
				selection: DraftOrderSelectedProductItem;
				pricingSnapshot: DraftOrderPricingSnapshot;
			}) =>
				dispatch({
					type: "add_item",
					item: createDraftItem(selection, pricingSnapshot),
				}),
			addPricedBundleItem: ({
				selection,
				pricingSnapshot,
			}: {
				selection: DraftOrderSelectedBundleItem;
				pricingSnapshot: DraftOrderPricingSnapshot;
			}) =>
				dispatch({
					type: "add_item",
					item: createDraftItem(selection, pricingSnapshot),
				}),
			addDemoProductItem: () =>
				dispatch({
					type: "add_item",
					item: createDraftItem(
						{
							type: "PRODUCT",
							productTypeId: crypto.randomUUID(),
							quantity: 2,
							label: "Par LED RGB x2",
						},
						createPricingSnapshot({
							currency: "USD",
							basePrice: "120.00",
							finalPrice: "120.00",
						}),
					),
				}),
			addDemoBundleItem: () =>
				dispatch({
					type: "add_item",
					item: createDraftItem(
						{
							type: "BUNDLE",
							bundleId: crypto.randomUUID(),
							label: "Kit streaming entrevista",
						},
						createPricingSnapshot({
							currency: "USD",
							basePrice: "250.00",
							finalPrice: "225.00",
							discountTotal: "25.00",
						}),
					),
				}),
			removeItem: (draftItemId: string) =>
				dispatch({ type: "remove_item", draftItemId }),
			setItemManualOverride: (
				draftItemId: string,
				finalPrice: string | null,
				reason?: string,
			) =>
				dispatch({
					type: "set_item_manual_override",
					draftItemId,
					finalPrice,
					reason,
				}),
			clearProposalPricing: () =>
				dispatch({ type: "set_proposal_pricing", proposalPricing: null }),
			resetDraft: () => dispatch({ type: "reset" }),
		},
	};
}
