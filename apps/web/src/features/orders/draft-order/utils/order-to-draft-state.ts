import type { DraftOrderDiscountLine } from "@repo/schemas";
import { FulfillmentMethod, OrderItemType } from "@repo/types";
import type {
	DraftOrderItem,
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
			return orderItemToDraftItem(item, financialLine);
		}),
		budget: null,
	};
}

function orderItemToDraftItem(
	item: ParsedOrderDetailResponseDto["items"][number],
	financialLine:
		| ParsedOrderDetailResponseDto["financial"]["items"][number]
		| undefined,
): DraftOrderItem {
	return {
		draftItemId: item.id,
		selection:
			item.type === OrderItemType.PRODUCT
				? productItemToDraftSelection(item)
				: bundleItemToDraftSelection(item),
		pricingSnapshot: financialLine
			? pricingToDraftPricingSnapshot(financialLine.pricing)
			: createEmptyPricingSnapshot(),
		budgetPreview: null,
	};
}

function productItemToDraftSelection(
	item: ParsedOrderDetailResponseDto["items"][number],
): DraftOrderSelectedProductItem {
	const firstAsset = item.assets[0];
	return {
		type: "PRODUCT",
		productTypeId: firstAsset?.productTypeId ?? "",
		assetId: firstAsset?.id,
		quantity: item.assets.length || 1,
		label: item.name,
	};
}

function bundleItemToDraftSelection(
	item: ParsedOrderDetailResponseDto["items"][number],
): DraftOrderSelectedBundleItem {
	return {
		type: "BUNDLE",
		bundleId: item.id,
		label: item.name,
	};
}

function pricingToDraftPricingSnapshot(
	pricing: ParsedOrderDetailResponseDto["financial"]["items"][number]["pricing"],
): DraftOrderPricingSnapshot {
	const discountTotal = pricing.effective.discounts.reduce((sum, d) => {
		return sum + parseFloat(d.discountAmount);
	}, 0);

	return {
		currency: "USD",
		basePrice: pricing.calculated.basePrice,
		finalPrice: pricing.effective.finalPrice,
		discountTotal: discountTotal.toFixed(2),
		discountLines: pricing.effective.discounts.map(
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

function createEmptyPricingSnapshot(): DraftOrderPricingSnapshot {
	return {
		currency: "USD",
		basePrice: "0.00",
		finalPrice: "0.00",
		discountTotal: "0.00",
		discountLines: [],
	};
}
