export type RentalPeriod = {
	start: Date;
	end: Date;
};

export type CartIncludedItem = {
	name: string;
	quantity: number;
	notes: string | null;
};

export type CartBundleComponent = {
	productTypeId: string;
	name: string;
	description: string | null;
	quantity: number;
	imageUrl: string | null;
	category: {
		id: string;
		name: string;
	} | null;
	includedItems: CartIncludedItem[];
};

export type CartProductItem = {
	type: "PRODUCT";
	productTypeId: string;
	name: string;
	quantity: number;
	pricePerUnit: number;
	billingUnitLabel: string;
	assetCount: number;
	imageUrl: string | null;
	includedItems: CartIncludedItem[];
};

export type CartBundleItem = {
	type: "BUNDLE";
	bundleId: string;
	name: string;
	quantity: number;
	price: number;
	billingUnitLabel: string;
	imageUrl: string | null;
	components: CartBundleComponent[];
};

export type CartItem = CartProductItem | CartBundleItem;

export type CartItemKey =
	| { type: "PRODUCT"; productTypeId: string }
	| { type: "BUNDLE"; bundleId: string };

export type ConflictAffectedItem =
	| { type: "PRODUCT"; productTypeId: string }
	| { type: "BUNDLE"; bundleId: string };

export type ConflictGroup = {
	productTypeId: string; // the contested physical asset's product type
	availableCount: number; // how many units actually exist and are free
	requestedCount: number; // how many units the current order is asking for
	affectedItems: ConflictAffectedItem[]; // which cart items are fighting over it
};

export type CartActions = {
	addProduct: (product: Omit<CartProductItem, "type" | "quantity">) => void;
	addBundle: (bundle: Omit<CartBundleItem, "type" | "quantity">) => void;
	incrementQuantity: (key: CartItemKey) => void;
	decrementQuantity: (key: CartItemKey) => void;
	setQuantity: (key: CartItemKey, value: number) => void;
	removeItem: (key: CartItemKey) => void;
	clearCart: () => void;
};

export type CartState = {
	items: CartItem[];
	actions: CartActions;
};
