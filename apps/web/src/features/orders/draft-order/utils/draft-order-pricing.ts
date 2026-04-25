import type {
	DraftOrderBudgetState,
	DraftOrderItem,
	DraftOrderItemBudgetPreview,
} from "@/features/orders/draft-order/types/draft-order.types";

const MONEY_AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

export function toMoneyCents(value: string): number | null {
	const trimmed = value.trim();

	if (!MONEY_AMOUNT_PATTERN.test(trimmed)) {
		return null;
	}

	const [wholePart, decimalPart = ""] = trimmed.split(".");
	const normalizedDecimal = decimalPart.padEnd(2, "0").slice(0, 2);

	return Number(wholePart) * 100 + Number(normalizedDecimal);
}

export function fromMoneyCents(value: number): string {
	const safeValue = Math.max(0, Math.trunc(value));
	const wholePart = Math.floor(safeValue / 100);
	const decimalPart = String(safeValue % 100).padStart(2, "0");

	return `${wholePart}.${decimalPart}`;
}

export function normalizeMoneyAmount(value: string): string | null {
	const cents = toMoneyCents(value);

	return cents === null ? null : fromMoneyCents(cents);
}

export function getBudgetPreviewFinalPrice(item: DraftOrderItem): string {
	return item.budgetPreview?.proposedFinalPrice ?? item.pricingSnapshot.finalPrice;
}

export function getBudgetAdjustmentAmount(item: DraftOrderItem): string {
	const effectiveCents = toMoneyCents(getBudgetPreviewFinalPrice(item)) ?? 0;
	const calculatedCents = toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0;

	return fromMoneyCents(Math.abs(effectiveCents - calculatedCents));
}

export function getBudgetAdjustmentDirection(
	item: DraftOrderItem,
): "DISCOUNT" | "SURCHARGE" | "NONE" {
	const effectiveCents = toMoneyCents(getBudgetPreviewFinalPrice(item)) ?? 0;
	const calculatedCents = toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0;

	if (effectiveCents < calculatedCents) {
		return "DISCOUNT";
	}

	if (effectiveCents > calculatedCents) {
		return "SURCHARGE";
	}

	return "NONE";
}

export function isValidNonNegativeMoneyAmount(value: string): boolean {
	return normalizeMoneyAmount(value) !== null;
}

export function buildDraftOrderBudget(
	items: DraftOrderItem[],
	targetTotal: string | null,
): DraftOrderBudgetState | null {
	const normalizedTargetTotal = targetTotal ? normalizeMoneyAmount(targetTotal) : null;

	if (!normalizedTargetTotal) {
		return null;
	}

	const currentItemsSubtotalCents = items.reduce((sum, item) => {
		return sum + (toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0);
	}, 0);
	const targetTotalCents = toMoneyCents(normalizedTargetTotal);

	if (targetTotalCents === null || items.length === 0) {
		return null;
	}

	const allocations = allocateTargetTotal(items, targetTotalCents);
	const currency = items[0]?.pricingSnapshot.currency ?? "USD";

	return {
		currency,
		currentItemsSubtotal: fromMoneyCents(currentItemsSubtotalCents),
		targetTotal: normalizedTargetTotal,
		proposedDiscountTotal: fromMoneyCents(
			Math.abs(currentItemsSubtotalCents - targetTotalCents),
		),
		items: items.map((item, index) => ({
			draftItemId: item.draftItemId,
			label: item.selection.label,
			currency: item.pricingSnapshot.currency,
			basePrice: item.pricingSnapshot.basePrice,
			currentFinalPrice: item.pricingSnapshot.finalPrice,
			proposedFinalPrice: fromMoneyCents(allocations[index]),
			proposedDiscountAmount: fromMoneyCents(
				Math.abs((toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0) - allocations[index]),
			),
		})),
	};
}

function allocateTargetTotal(items: DraftOrderItem[], targetTotalCents: number): number[] {
	const currentTotalCents = items.reduce((sum, item) => {
		return sum + (toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0);
	}, 0);

	if (items.length === 0) {
		return [];
	}

	if (currentTotalCents === 0) {
		const equalShare = Math.round(targetTotalCents / items.length);
		const rounded = items.map(() => equalShare);
		const roundedTotal = rounded.reduce((sum, value) => sum + value, 0);
		const remainder = targetTotalCents - roundedTotal;

		if (remainder !== 0) {
			rounded[0] += remainder;
		}

		return rounded;
	}

	const rawAllocations = items.map((item) => {
		const currentFinalPriceCents = toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0;
		return Math.round((currentFinalPriceCents * targetTotalCents) / currentTotalCents);
	});
	const roundedTotal = rawAllocations.reduce((sum, value) => sum + value, 0);
	const remainder = targetTotalCents - roundedTotal;

	if (remainder !== 0) {
		const remainderTargetIndex = items.reduce((selectedIndex, item, index, source) => {
			if (selectedIndex === -1) {
				return index;
			}

			const itemPrice = toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0;
			const selectedPrice = toMoneyCents(source[selectedIndex].pricingSnapshot.finalPrice) ?? 0;

			return itemPrice > selectedPrice ? index : selectedIndex;
		}, -1);

		rawAllocations[remainderTargetIndex] += remainder;
	}

	return rawAllocations;
}
