import type { RentalProductResponse } from "@repo/schemas";
import { useCartActions, useCartItems } from "../cart.hooks";

export function useProductCardState(product: RentalProductResponse) {
	const items = useCartItems();
	const { addProduct, incrementQuantity, decrementQuantity } = useCartActions();

	const cartItem = items.find(
		(i) => i.type === "PRODUCT" && i.productTypeId === product.id,
	);

	const isInCart = cartItem !== undefined;
	const quantity = cartItem?.quantity ?? 0;
	const maxQuantity = product.availableCount;
	const isUnavailable = maxQuantity === 0;
	const isAvailable = maxQuantity === null || maxQuantity > 0;
	const canIncrement = maxQuantity === null || quantity < maxQuantity;

	function handleAdd() {
		if (isUnavailable) {
			return;
		}

		addProduct({
			productTypeId: product.id,
			name: product.name,
			pricePerUnit: product.pricingTiers[0].pricePerUnit,
			billingUnitLabel: product.billingUnit.label,
			assetCount: product.availableCount,
			imageUrl: product.imageUrl ?? null,
			includedItems: product.includedItems ?? [],
		});
	}

	function handleIncrement() {
		incrementQuantity({ type: "PRODUCT", productTypeId: product.id });
	}

	function handleDecrement() {
		decrementQuantity({ type: "PRODUCT", productTypeId: product.id });
	}

	return {
		isAvailable,
		isUnavailable,
		isInCart,
		quantity,
		maxQuantity,
		canIncrement,
		handleAdd,
		handleIncrement,
		handleDecrement,
	};
}
