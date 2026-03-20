import { Skeleton } from "@/components/ui/skeleton";
import type {
  CartProductItem,
  CartBundleItem,
  CartIncludedItem,
  CartBundleComponent,
} from "@/features/rental/cart/cart.types";
import type { CartPriceLineItem } from "@repo/schemas";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { CheckCircle2, Package, ShoppingBag, XCircle } from "lucide-react";
import { formatCurrency } from "../cart.utils";
import { useCartPageContext } from "../cart-page.context";

export function CartPageItemList() {
  const { cartItems, breakdown, isPriceLoading, unavailableIds } =
    useCartPageContext();

  const items = cartItems;
  const lines = breakdown?.lineItems ?? [];
  const isLoading = isPriceLoading;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border border-neutral-200 py-16">
        <ShoppingBag className="h-10 w-10 text-neutral-200" />
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Tu pedido está vacío
          </p>
          <p className="mt-1 text-xs text-neutral-300">Nada que revisar aún.</p>
        </div>
        <Link
          to="/rental"
          className="mt-2 text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4"
        >
          Buscar Equipos →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-black">
          Equipos Seleccionados
        </h2>
        <span className="text-xs text-neutral-400">
          {totalQuantity} {totalQuantity === 1 ? "item" : "items"} seleccionados
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const line = lines.find(
            (l) =>
              l.id ===
              (item.type === "PRODUCT" ? item.productTypeId : item.bundleId),
          );

          if (item.type === "PRODUCT") {
            return (
              <CartPageStandaloneItem
                key={item.productTypeId}
                item={item as CartProductItem}
                line={line}
                isLoading={isLoading}
                isUnavailable={unavailableIds.includes(item.productTypeId)}
              />
            );
          }

          return (
            <CartPageBundleItem
              key={item.bundleId}
              item={item as CartBundleItem}
              line={line}
              isLoading={isLoading}
              isUnavailable={unavailableIds.includes(item.bundleId)}
            />
          );
        })}
      </div>
    </div>
  );
}

type CartPageStandaloneItemProps = {
  item: CartProductItem;
  line: CartPriceLineItem | undefined;
  isLoading: boolean;
  isUnavailable: boolean;
};

export function CartPageStandaloneItem({
  item,
  line,
  isLoading,
  isUnavailable,
}: CartPageStandaloneItemProps) {
  return (
    <div
      className={clsx(
        "border bg-white border-neutral-200",
        isUnavailable && "border-red-300 border-l-4 border-l-red-500",
      )}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden">
          <CartPageImage src={item.imageUrl} alt={item.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black uppercase tracking-wide text-black">
            {item.name}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {isLoading ? (
            <Skeleton className="mb-1 ml-auto h-5 w-20" />
          ) : line ? (
            <p className="text-base font-black text-black">
              {formatCurrency(line.pricePerBillingUnit)}{" "}
              <span className="uppercase text-xs tracking-wider font-semibold text-neutral-400">
                / {item.billingUnitLabel}
              </span>
            </p>
          ) : null}
          <p className="text-sm uppercase tracking-wider text-neutral-400 pt-1">
            Qty: {item.quantity}
          </p>
        </div>
      </div>

      {isUnavailable && (
        <div className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2.5">
          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-600">
            No disponible para tu periodo seleccionado — cambia las fechas o
            quita este item.
          </p>
        </div>
      )}

      <div className="px-4 pb-4">
        <CartPageIncludedItems items={item.includedItems} />
      </div>
    </div>
  );
}

type CartPageBundleItemProps = {
  item: CartBundleItem;
  line: CartPriceLineItem | undefined;
  isLoading: boolean;
  isUnavailable: boolean;
};

function CartPageBundleItem({
  item,
  line,
  isLoading,
  isUnavailable,
}: CartPageBundleItemProps) {
  return (
    <div
      className={clsx(
        "border bg-white border-neutral-200",
        isUnavailable && "border-red-300 border-l-4 border-l-red-500",
      )}
    >
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4">
        <p className="text-base font-black uppercase tracking-wide text-black">
          {item.name}
        </p>
        <span className="shrink-0 border border-neutral-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
          Combo
        </span>
        <div className="ml-auto shrink-0 text-right">
          {isLoading ? (
            <Skeleton className="ml-auto h-6 w-24" />
          ) : line ? (
            <p className="text-lg font-black text-black">
              {formatCurrency(line.subtotal)}
            </p>
          ) : null}
          {item.quantity > 1 && (
            <p className="text-[11px] uppercase tracking-wider text-neutral-400">
              Qty: {item.quantity}
            </p>
          )}
        </div>
      </div>

      {isUnavailable && (
        <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5">
          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-600">
            No disponible para tu periodo seleccionado — cambia las fechas o
            quita este item.
          </p>
        </div>
      )}

      <div className="space-y-px bg-neutral-100 p-3">
        {item.components.map((component) => (
          <CartPageBundleComponent
            key={component.productTypeId}
            component={component}
          />
        ))}
      </div>
    </div>
  );
}

type CartPageBundleComponentProps = {
  component: CartBundleComponent;
};

function CartPageBundleComponent({ component }: CartPageBundleComponentProps) {
  return (
    <div className="border border-neutral-100 bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden">
          <CartPageImage src={component.imageUrl} alt={component.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-black">
            {component.name}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs italic text-neutral-400">
            Incluido en el Combo
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral-400">
            Qty: {component.quantity}
          </p>
        </div>
      </div>
      <CartPageIncludedItems items={component.includedItems} />
    </div>
  );
}

type CartPageImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

function CartPageImage({ src, alt, className = "" }: CartPageImageProps) {
  if (src) {
    return (
      <img
        src={`${import.meta.env.VITE_R2_PUBLIC_URL}/${src}`}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-neutral-100 ${className}`}
    >
      <Package className="h-6 w-6 text-neutral-300" />
    </div>
  );
}

type CartPageIncludedItemsProps = {
  items: CartIncludedItem[];
};

function CartPageIncludedItems({ items }: CartPageIncludedItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 border border-neutral-100 bg-neutral-50 px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        Incluido con este alquiler
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-neutral-400" />
            <span className="text-xs text-neutral-600">
              {item.name}
              {item.quantity > 1 && (
                <span className="ml-1 text-neutral-400">×{item.quantity}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
