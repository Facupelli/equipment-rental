import { OrderItemType, OrderStatus } from "@repo/types";
import type { Dayjs } from "dayjs";
import type { ParsedOrderListItem } from "./orders.queries";
import type { ParsedOrderDetailResponseDto } from "./queries/get-order-by-id";

type OrderItem = ParsedOrderDetailResponseDto["items"][number];
type AssetSummary = OrderItem["assets"][number];

export function formatOrderNumber(orderNumber: number): string {
	return `ORD-${String(orderNumber).padStart(5, "0")}`;
}

export function formatMoney(amount: string, currency: string = "ARS"): string {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(parseFloat(amount));
}

/**
 * Returns the serial number of the first asset for non-bundle items.
 * Bundles don't have a single serial number, so they return null.
 */
export function getItemSerialNumber(item: OrderItem): string | null {
	if (item.type === OrderItemType.BUNDLE) return null;
	return item.assets[0]?.serialNumber ?? null;
}

/**
 * Returns the quantity of an item, derived from the number of assigned assets.
 * Falls back to 1 for items with no assets yet (e.g. not yet assigned).
 */
export function getItemQty(item: OrderItem): number {
	return item.assets.length || 1;
}

/**
 * Returns a human-readable summary of a bundle's components.
 * Example: "2× Tripod · 1× Light Panel"
 * Returns null for non-bundle items.
 */
export function getBundleSummary(item: OrderItem): string | null {
	if (item.type !== OrderItemType.BUNDLE) return null;
	return item.components
		.map((c) => `${c.quantity}× ${c.productTypeName}`)
		.join(" · ");
}

/**
 * Returns a comma-separated string of unique owner names across all assets.
 * Returns null if no asset has a known owner.
 */
export function getOwnerDisplay(assets: AssetSummary[]): string | null {
	const ownerNames = [
		...new Set(
			assets
				.map((a) => a.ownerName)
				.filter((name): name is string => name !== null),
		),
	];
	return ownerNames.length > 0 ? ownerNames.join(", ") : null;
}

// ─── Bundle ownership ─────────────────────────────────────────────────────────

export type ExternalOwnerEntry = {
	/** The product type name as snapshotted at booking time. */
	productTypeName: string;
	/** Comma-joined unique owner names for this product type within the bundle. */
	ownerNames: string;
};

/**
 * For bundle items, returns one entry per product type that has at least one
 * externally-owned asset. Each entry groups all external owners for that product
 * type into a single display string.
 *
 * Returns an empty array for non-bundle items — use getOwnerDisplay instead.
 *
 * Example output:
 *   [
 *     { productTypeName: "Tripod",      ownerNames: "John Smith" },
 *     { productTypeName: "Light Panel", ownerNames: "Maria García, John Smith" },
 *   ]
 */
export function getExternalOwnersByProductType(
	item: OrderItem,
): ExternalOwnerEntry[] {
	if (item.type !== OrderItemType.BUNDLE) return [];

	// Map productTypeId → productTypeName using the bundle component snapshot.
	// This is snapshot data — safe even if the product type is later renamed.
	const productTypeNameById = new Map(
		item.components.map((c) => [c.productTypeId, c.productTypeName]),
	);

	// Group external owner names by productTypeId.
	const ownersByProductTypeId = new Map<string, Set<string>>();

	for (const asset of item.assets) {
		if (!asset.ownerName) continue; // rental-owned, skip

		const owners = ownersByProductTypeId.get(asset.productTypeId) ?? new Set();
		owners.add(asset.ownerName);
		ownersByProductTypeId.set(asset.productTypeId, owners);
	}

	// Build the final entries, preserving the component declaration order.
	const entries: ExternalOwnerEntry[] = [];

	for (const [productTypeId, owners] of ownersByProductTypeId) {
		const productTypeName = productTypeNameById.get(productTypeId);
		if (!productTypeName) continue; // asset references an unknown component — skip

		entries.push({
			productTypeName,
			ownerNames: [...owners].join(", "),
		});
	}

	return entries;
}

export type RelativeOrderDateContext = {
	label: string;
	isToday: boolean;
	isPast: boolean;
	isFuture: boolean;
};

export function getRelativeOrderDateContext(
	value: Dayjs,
	referenceDate: Dayjs,
): RelativeOrderDateContext {
	const diffDays = value
		.startOf("day")
		.diff(referenceDate.startOf("day"), "day");

	if (diffDays === 0) {
		return {
			label: "Hoy",
			isToday: true,
			isPast: false,
			isFuture: false,
		};
	}

	if (diffDays === 1) {
		return {
			label: "Mañana",
			isToday: false,
			isPast: false,
			isFuture: true,
		};
	}

	if (diffDays === -1) {
		return {
			label: "Ayer",
			isToday: false,
			isPast: true,
			isFuture: false,
		};
	}

	if (diffDays > 1) {
		return {
			label: `En ${diffDays} días`,
			isToday: false,
			isPast: false,
			isFuture: true,
		};
	}

	return {
		label: `Hace ${Math.abs(diffDays)} días`,
		isToday: false,
		isPast: true,
		isFuture: false,
	};
}

export function hasOrderTodayEvent(
	order: Pick<ParsedOrderListItem, "pickupAt" | "returnAt">,
	referenceDate: Dayjs,
): boolean {
	return [order.pickupAt, order.returnAt].some(
		(value) => getRelativeOrderDateContext(value, referenceDate).isToday,
	);
}

export type OrderOperationalPhase =
	| "pending"
	| "active"
	| "returned"
	| "cancelled"
	| "rejected"
	| "expired";

export function getOrderOperationalPhase(
	order: Pick<ParsedOrderListItem, "status" | "pickupAt" | "returnAt">,
	referenceDate: Dayjs,
): OrderOperationalPhase {
	switch (order.status) {
		case OrderStatus.CANCELLED:
			return "cancelled";
		case OrderStatus.REJECTED:
			return "rejected";
		case OrderStatus.EXPIRED:
			return "expired";
	}

	if (referenceDate.isBefore(order.pickupAt)) {
		return "pending";
	}

	if (referenceDate.isAfter(order.returnAt)) {
		return "returned";
	}

	return "active";
}
