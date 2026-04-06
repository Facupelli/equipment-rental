import type { BundleItemResponse } from "@repo/schemas";
import { useCartActions, useCartItems } from "../cart.hooks";

export function useBundleCardState(bundle: BundleItemResponse) {
	const items = useCartItems();
	const { addBundle, removeItem } = useCartActions();

	const isInCart = items.some(
		(i) => i.type === "BUNDLE" && i.bundleId === bundle.id,
	);

	function handleAdd() {
		addBundle({
			bundleId: bundle.id,
			name: bundle.name,
			billingUnitLabel: bundle.billingUnit.label,
			imageUrl: bundle.imageUrl ?? "",
			price: bundle.pricingPreview?.pricePerUnit ?? 0,
			components: bundle.components.map((component) => ({
				productTypeId: component.productType.id,
				name: component.productType.name,
				quantity: component.quantity,
				description: component.productType.description,
				imageUrl: component.productType.imageUrl,
				category: component.productType.category,
				includedItems: component.productType.includedItems,
			})),
		});
	}

	function handleRemove() {
		removeItem({ type: "BUNDLE", bundleId: bundle.id });
	}

	return { isInCart, handleAdd, handleRemove };
}
