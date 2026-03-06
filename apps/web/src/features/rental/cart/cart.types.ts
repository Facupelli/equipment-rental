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
  billingUnitLabel: string;
  includedItems: CartIncludedItem[];
};

export type CartProductItem = {
  type: "PRODUCT";
  productTypeId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnitLabel: string;
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

// Price breakdown types — shared between cart page and useCartPriceBreakdown hook
export type PriceBreakdownLine = {
  id: string;
  type: "PRODUCT" | "BUNDLE";
  name: string;
  sublabel: string;
  unitPrice: number;
  units: number;
  quantity: number;
  lineTotal: number;
};

export type PriceBreakdownResponse = {
  lines: PriceBreakdownLine[];
  subtotal: number;
  total: number;
};
