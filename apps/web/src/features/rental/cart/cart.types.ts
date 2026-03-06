export type RentalPeriod = {
  start: Date;
  end: Date;
};

export type CartBundleComponent = {
  productTypeId: string;
  name: string;
  description: string | null;
  quantity: number;
};

export type CartProductItem = {
  type: "PRODUCT";
  productTypeId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnitLabel: string;
};

export type CartBundleItem = {
  type: "BUNDLE";
  bundleId: string;
  name: string;
  quantity: number;
  price: number;
  billingUnitLabel: string;
  components: CartBundleComponent[];
};

export type CartItem = CartProductItem | CartBundleItem;

export type CartItemKey =
  | { type: "PRODUCT"; productTypeId: string }
  | { type: "BUNDLE"; bundleId: string };

export type CartActions = {
  setPeriod: (start: Date, end: Date) => void;
  clearPeriod: () => void;
  addProduct: (product: Omit<CartProductItem, "type" | "quantity">) => void;
  addBundle: (bundle: Omit<CartBundleItem, "type" | "quantity">) => void;
  incrementQuantity: (key: CartItemKey) => void;
  decrementQuantity: (key: CartItemKey) => void;
  removeItem: (key: CartItemKey) => void;
  clearCart: () => void;
};

export type CartState = {
  period: RentalPeriod | null;
  items: CartItem[];
  actions: CartActions;
};
