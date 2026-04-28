import type { DraftOrderDiscountLine } from "@repo/schemas";
import { FulfillmentMethod, OrderItemType } from "@repo/types";
import type {
	DraftOrderItem,
	DraftOrderItemBudgetPreview,
	DraftOrderPricingSnapshot,
	DraftOrderSelectedBundleItem,
	DraftOrderSelectedProductItem,
	DraftOrderState,
} from "@/features/orders/draft-order/types/draft-order.types";
import { EMPTY_DRAFT_ORDER_DELIVERY_REQUEST } from "@/features/orders/draft-order/types/draft-order.types";
import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";

export function orderToDraftOrderState(
	order: ParsedOrderDetailResponseDto,
): DraftOrderState {
	const hasManualPricing = order.financial.items.some(
		(item) => item.pricing.isOverridden,
	);
	const budgetByItemId = hasManualPricing
		? buildLoadedDraftBudgetPreviewByItemId(order)
		: null;

	return {
		currency: order.financial.items[0]?.currency ?? "USD",
		customer: order.customer
			? {
					id: order.customer.id,
					displayName:
						order.customer.companyName ??
						`${order.customer.firstName} ${order.customer.lastName}`.trim(),
				}
			: null,
		rentalPeriod: {
			pickupDate: order.bookingSnapshot.pickupDate.format("YYYY-MM-DD"),
			returnDate: order.bookingSnapshot.returnDate.format("YYYY-MM-DD"),
			pickupTime: order.bookingSnapshot.pickupTime,
			returnTime: order.bookingSnapshot.returnTime,
		},
		fulfillmentMethod: order.fulfillmentMethod,
		deliveryRequest: order.deliveryRequest
			? {
					recipientName: order.deliveryRequest.recipientName,
					phone: order.deliveryRequest.phone,
					addressLine1: order.deliveryRequest.addressLine1,
					addressLine2: order.deliveryRequest.addressLine2 ?? "",
					city: order.deliveryRequest.city,
					stateRegion: order.deliveryRequest.stateRegion,
					postalCode: order.deliveryRequest.postalCode,
					country: order.deliveryRequest.country,
					instructions: order.deliveryRequest.instructions ?? "",
				}
			: order.fulfillmentMethod === FulfillmentMethod.DELIVERY
				? EMPTY_DRAFT_ORDER_DELIVERY_REQUEST
				: null,
		items: order.items.map((item) => {
			const financialLine = order.financial.items.find(
				(f) => f.orderItemId === item.id,
			);
			return orderItemToDraftItem(
				item,
				financialLine,
				budgetByItemId?.get(item.id) ?? null,
			);
		}),
		budget: hasManualPricing
			? {
				currency: order.financial.items[0]?.currency ?? "USD",
				currentItemsSubtotal: order.financial.subtotalBeforeDiscounts,
				targetTotal: order.financial.itemsSubtotal,
				proposedDiscountTotal: absoluteMoneyDifference(
					order.financial.subtotalBeforeDiscounts,
					order.financial.itemsSubtotal,
				),
				items: Array.from(budgetByItemId?.values() ?? []),
			}
			: null,
	};
}

function orderItemToDraftItem(
	item: ParsedOrderDetailResponseDto["items"][number],
	financialLine:
		| ParsedOrderDetailResponseDto["financial"]["items"][number]
		| undefined,
	budgetPreview: DraftOrderItemBudgetPreview | null,
): DraftOrderItem {
	return {
		draftItemId: item.id,
		selection:
			item.type === OrderItemType.PRODUCT
				? productItemToDraftSelection(item)
				: bundleItemToDraftSelection(item),
		pricingSnapshot: financialLine
			? pricingToDraftPricingSnapshot(financialLine)
			: createEmptyPricingSnapshot(),
		budgetPreview,
	};
}

function productItemToDraftSelection(
	item: Extract<
		ParsedOrderDetailResponseDto["items"][number],
		{ type: OrderItemType.PRODUCT }
	>,
): DraftOrderSelectedProductItem {
	const firstAsset = item.assets[0];
	return {
		type: "PRODUCT",
		productTypeId: item.productTypeId,
		assetId: firstAsset?.id,
		quantity: item.assets.length || 1,
		label: item.name,
	};
}

function bundleItemToDraftSelection(
	item: Extract<
		ParsedOrderDetailResponseDto["items"][number],
		{ type: OrderItemType.BUNDLE }
	>,
): DraftOrderSelectedBundleItem {
	return {
		type: "BUNDLE",
		bundleId: item.bundleId,
		label: item.name,
	};
}

function pricingToDraftPricingSnapshot(
	financialLine: ParsedOrderDetailResponseDto["financial"]["items"][number],
): DraftOrderPricingSnapshot {
	const { pricing } = financialLine;
	const discountTotal = pricing.calculated.discounts.reduce((sum, d) => {
		return sum + parseFloat(d.discountAmount);
	}, 0);

	return {
		currency: financialLine.currency,
		basePrice: pricing.calculated.basePrice,
		finalPrice: pricing.calculated.finalPrice,
		discountTotal: discountTotal.toFixed(2),
		discountLines: pricing.calculated.discounts.map(
			(d): DraftOrderDiscountLine => ({
				sourceKind: d.sourceKind,
				sourceId: d.sourceId,
				label: d.label,
				promotionId: d.promotionId,
				promotionLabel: d.promotionLabel,
				type: d.type,
				value: d.value,
				discountAmount: d.discountAmount,
			}),
		),
	};
}

function buildLoadedDraftBudgetPreviewByItemId(
	order: ParsedOrderDetailResponseDto,
): Map<string, DraftOrderItemBudgetPreview> {
	return new Map(
		order.financial.items.map((item) => [
			item.orderItemId,
			{
				draftItemId: item.orderItemId,
				label: item.label,
				currency: item.currency,
				basePrice: item.pricing.calculated.basePrice,
				currentFinalPrice: item.pricing.calculated.finalPrice,
				proposedFinalPrice: item.pricing.effective.finalPrice,
				proposedDiscountAmount: absoluteMoneyDifference(
					item.pricing.calculated.finalPrice,
					item.pricing.effective.finalPrice,
				),
			},
		]),
	);
}

function absoluteMoneyDifference(left: string, right: string): string {
	const leftAmount = Number.parseFloat(left);
	const rightAmount = Number.parseFloat(right);

	return Math.abs(leftAmount - rightAmount).toFixed(2);
}

function createEmptyPricingSnapshot(): DraftOrderPricingSnapshot {
	return {
		currency: "USD",
		basePrice: "0.00",
		finalPrice: "0.00",
		discountTotal: "0.00",
		discountLines: [],
	};
}
