import type { DraftOrderDiscountLine } from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import { useReducer } from "react";
import type {
	DraftOrderCustomerRef,
	DraftOrderItem,
	DraftOrderBudgetState,
	DraftOrderPricingSnapshot,
	DraftOrderSelectedBundleItem,
	DraftOrderSelectedProductItem,
	DraftOrderState,
} from "@/features/orders/draft-order/types/draft-order.types";
import {
	EMPTY_DRAFT_ORDER_DELIVERY_REQUEST,
	EMPTY_DRAFT_ORDER_RENTAL_PERIOD,
} from "@/features/orders/draft-order/types/draft-order.types";
import {
	buildDraftOrderBudget,
	fromMoneyCents,
	getBudgetAdjustmentAmount,
	getBudgetAdjustmentDirection,
	getBudgetPreviewFinalPrice,
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
			type: "set_budget_target_total";
			targetTotal: string | null;
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
		budget: null,
	};
}

function recalculateBudget(state: DraftOrderState): DraftOrderState {
	const targetTotal = state.budget?.targetTotal ?? null;
	const budget = buildDraftOrderBudget(state.items, targetTotal);

	return {
		...state,
		budget,
		items: state.items.map((item) => ({
			...item,
			budgetPreview:
				budget?.items.find((preview) => preview.draftItemId === item.draftItemId) ??
				null,
		})),
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
			return recalculateBudget({
				...state,
				currency: action.item.pricingSnapshot.currency,
				items: [...state.items, action.item],
			});

		case "remove_item":
			return recalculateBudget({
				...state,
				items: state.items.filter(
					(item) => item.draftItemId !== action.draftItemId,
				),
			});

		case "set_budget_target_total": {
			const normalizedTargetTotal =
				action.targetTotal === null ? null : normalizeMoneyAmount(action.targetTotal);

			if (action.targetTotal !== null && normalizedTargetTotal === null) {
				return state;
			}

			return recalculateBudget({
				...state,
				budget:
					normalizedTargetTotal === null
						? null
						: ({ targetTotal: normalizedTargetTotal } as DraftOrderBudgetState),
			});
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
		budgetPreview: null,
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
	const budgetSubtotalCents = state.items.reduce((sum, item) => {
		return sum + (toMoneyCents(getBudgetPreviewFinalPrice(item)) ?? 0);
	}, 0);
	const budgetAdjustmentDeltaCents = budgetSubtotalCents - calculatedSubtotalCents;

	return {
		state,
		derived: {
			totals: {
				calculatedSubtotal: fromMoneyCents(calculatedSubtotalCents),
				budgetSubtotal: fromMoneyCents(budgetSubtotalCents),
				targetTotal: state.budget?.targetTotal ?? null,
				budgetAdjustmentTotal: fromMoneyCents(
					Math.abs(budgetAdjustmentDeltaCents),
				),
				budgetAdjustmentDirection:
					budgetAdjustmentDeltaCents < 0
						? "DISCOUNT"
						: budgetAdjustmentDeltaCents > 0
							? "SURCHARGE"
							: ("NONE" as "DISCOUNT" | "SURCHARGE" | "NONE"),
				hasBudget: Boolean(state.budget),
			},
			pricingByItemId: Object.fromEntries(
				state.items.map((item) => [
					item.draftItemId,
					{
						budgetPreviewFinalPrice: getBudgetPreviewFinalPrice(item),
						budgetAdjustmentAmount: getBudgetAdjustmentAmount(item),
						budgetAdjustmentDirection: getBudgetAdjustmentDirection(item),
						hasBudgetPreview: item.budgetPreview !== null,
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
			setBudgetTargetTotal: (targetTotal: string | null) =>
				dispatch({ type: "set_budget_target_total", targetTotal }),
			resetDraft: () => dispatch({ type: "reset" }),
		},
	};
}
