import type { DraftOrderItem } from "@/features/orders/draft-order/types/draft-order.types";

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

export function getEffectiveFinalPrice(item: DraftOrderItem): string {
	return item.manualOverride?.finalPrice ?? item.pricingSnapshot.finalPrice;
}

export function isManualOverrideActive(item: DraftOrderItem): boolean {
	return item.manualOverride !== null;
}

export function getManualAdjustmentAmount(item: DraftOrderItem): string {
	const effectiveCents = toMoneyCents(getEffectiveFinalPrice(item)) ?? 0;
	const calculatedCents = toMoneyCents(item.pricingSnapshot.finalPrice) ?? 0;

	return fromMoneyCents(Math.abs(effectiveCents - calculatedCents));
}

export function getManualAdjustmentDirection(
	item: DraftOrderItem,
): "DISCOUNT" | "SURCHARGE" | "NONE" {
	const effectiveCents = toMoneyCents(getEffectiveFinalPrice(item)) ?? 0;
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
