import { createFileRoute, useSearch } from "@tanstack/react-router";
import type {
  CartBundleComponent,
  CartBundleItem,
  CartIncludedItem,
  CartProductItem,
  RentalPeriod,
} from "@/features/rental/cart/cart.types";
import {
  useCartIsEmpty,
  useCartItems,
} from "@/features/rental/cart/cart.hooks";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Link,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useCartPricePreview } from "@/features/rental/rental.queries";
import type {
  CalculateCartPricesRequest,
  CartPriceLineItem,
  CartPriceResult,
} from "@repo/schemas";

const cartPageSearchSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  locationId: z.string(),
});

export const Route = createFileRoute("/_customer/cart/")({
  validateSearch: cartPageSearchSchema,
  component: CartPage,
});

function CartPage() {
  const { startDate, endDate, locationId } = useSearch({
    from: "/_customer/cart/",
  });

  const items = useCartItems();

  const data: CalculateCartPricesRequest = {
    currency: "USD",
    locationId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    items: items.map((item) => {
      if (item.type === "PRODUCT") {
        return {
          type: "PRODUCT",
          productTypeId: item.productTypeId,
          quantity: item.quantity,
        };
      }
      return {
        type: "BUNDLE",
        bundleId: item.bundleId,
        quantity: item.quantity,
      };
    }),
  };

  const {
    data: breakdown,
    isPending,
    isError,
  } = useCartPricePreview(data, {
    enabled:
      startDate !== undefined &&
      endDate !== undefined &&
      locationId !== undefined,
  });

  function handleBook() {
    // TODO: wire to order creation mutation when backend spec is ready
    console.log("Book equipment — placeholder");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        <div className="">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            Review Your Order
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Please check your rental details before proceeding to booking.
          </p>
        </div>

        <div>
          <CartPagePeriod />
        </div>

        {/*
          CSS Grid — two-column layout per flexbox-grid document:
          Parent-driven structure. Left column owns the content flow.
          Right column is fixed-width sticky sidebar.
          Mobile: single column, sidebar stacks below.
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          {/* Left column */}

          <CartPageItemList
            lines={breakdown?.lineItems ?? []}
            isLoading={isPending}
          />

          {/* Right column — sticky sidebar */}
          <CartPageSidebar
            breakdown={breakdown}
            isLoading={isPending}
            isError={isError}
            onBook={handleBook}
          />
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(period: RentalPeriod): string {
  const ms = period.end.getTime() - period.start.getTime();
  const totalDays = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks === 0) return `${days} ${days === 1 ? `Day` : `Days`}`;
  if (days === 0) return `${weeks} ${weeks === 1 ? `Week` : `Weeks`}`;
  return `${weeks} ${weeks === 1 ? `Week` : `Weeks`}, ${days} ${days === 1 ? `Day` : `Days`}`;
}

function CartPagePeriod() {
  const { startDate, endDate, locationId } = useSearch({
    from: "/_customer/cart/",
  });

  const { data: locations } = useLocations();
  const location = locations?.find((l) => l.id === locationId);

  if (!startDate || !endDate) {
    return (
      <div className="mb-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-black">
          Rental Period
        </p>
        <div className="flex items-center gap-3 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            No rental period selected — go back to set your dates before
            booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 divide-x divide-neutral-200 py-4">
      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Rental Period
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />

          <p className="text-sm font-semibold text-black">
            {formatDate(startDate)} — {formatDate(endDate)}
          </p>
        </div>
      </div>
      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Total Duration
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
          <p className="text-sm font-semibold text-black">
            {formatDuration({ start: startDate, end: endDate })}
          </p>
        </div>
      </div>
      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Pickup Location
        </p>
        <div className="pt-1">
          {location ? (
            <p className="text-sm font-semibold text-black">{location.name}</p>
          ) : (
            <p className="text-sm text-neutral-300">Not selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

type CartPageIncludedItemsProps = {
  items: CartIncludedItem[];
};

function CartPageIncludedItems({ items }: CartPageIncludedItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border border-neutral-100 bg-neutral-50 px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        Included with this rental
      </p>
      {/* Flexbox with flex-wrap — content-driven tags of varying widths */}
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

type CartPageImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

function CartPageImage({ src, alt, className = "" }: CartPageImageProps) {
  if (src) {
    return (
      <img
        src={src}
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

type CartPageBundleComponentProps = {
  component: CartBundleComponent;
};

function CartPageBundleComponent({ component }: CartPageBundleComponentProps) {
  return (
    <div className="border border-neutral-100 bg-white p-4">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden">
          <CartPageImage src={component.imageUrl} alt={component.name} />
        </div>

        {/* Name + label */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-black">
            {component.name}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral-400">
            {component.billingUnitLabel}
          </p>
        </div>

        {/* Right: included in bundle + qty */}
        <div className="shrink-0 text-right">
          <p className="text-xs italic text-neutral-400">Included in Bundle</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral-400">
            Qty: {component.quantity}
          </p>
        </div>
      </div>

      <CartPageIncludedItems items={component.includedItems} />
    </div>
  );
}

type CartPageStandaloneItemProps = {
  item: CartProductItem;
  line: CartPriceLineItem | undefined;
  isLoading: boolean;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function CartPageStandaloneItem({
  item,
  line,
  isLoading,
}: CartPageStandaloneItemProps) {
  return (
    <div className="border border-neutral-200 bg-white">
      <div className="flex items-start gap-4 p-4">
        {/* Thumbnail */}
        <div className="h-20 w-20 shrink-0 overflow-hidden">
          <CartPageImage src={item.imageUrl} alt={item.name} />
        </div>

        {/* Name + label */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-black uppercase tracking-wide text-black">
            {item.name}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral-400">
            {item.billingUnitLabel}
          </p>
        </div>

        {/* Right: price + qty */}
        <div className="shrink-0 text-right">
          {isLoading ? (
            <Skeleton className="mb-1 ml-auto h-5 w-20" />
          ) : line ? (
            <p className="text-base font-black text-black">
              {formatCurrency(line.subtotal)}
            </p>
          ) : null}
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            Qty: {item.quantity}
          </p>
        </div>
      </div>

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
};

function CartPageBundleItem({
  item,
  line,
  isLoading,
}: CartPageBundleItemProps) {
  return (
    <div className="border border-neutral-200 bg-white">
      {/* Bundle header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4">
        <p className="text-base font-black uppercase tracking-wide text-black">
          {item.name}
        </p>
        <span className="shrink-0 border border-neutral-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
          Bundle
        </span>

        {/* Price right-aligned */}
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

      {/* Nested components */}
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

type CartPageItemListProps = {
  lines: CartPriceLineItem[];
  isLoading: boolean;
};

export function CartPageItemList({ lines, isLoading }: CartPageItemListProps) {
  const items = useCartItems();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border border-neutral-200 py-16">
        <ShoppingBag className="h-10 w-10 text-neutral-200" />
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Your order is empty
          </p>
          <p className="mt-1 text-xs text-neutral-300">
            Nothing to review yet.
          </p>
        </div>
        <Link
          to="/rental"
          className="mt-2 text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4"
        >
          Browse Equipment →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-black">
          Selected Equipment
        </h2>
        <span className="text-xs text-neutral-400">
          {totalQuantity} {totalQuantity === 1 ? "item" : "items"} selected
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
                item={item}
                line={line}
                isLoading={isLoading}
              />
            );
          }

          return (
            <CartPageBundleItem
              key={item.bundleId}
              item={item}
              line={line}
              isLoading={isLoading}
            />
          );
        })}
      </div>
    </div>
  );
}

type CartPageSidebarProps = {
  breakdown: CartPriceResult | undefined;
  isLoading: boolean;
  isError: boolean;
  onBook: () => void;
};

function CartPageSidebar({
  breakdown,
  isLoading,
  isError,
  onBook,
}: CartPageSidebarProps) {
  const { startDate, endDate } = useSearch({
    from: "/_customer/cart/",
  });
  const isEmpty = useCartIsEmpty();

  const isDisabled = isEmpty || !startDate || !endDate || isLoading || isError;

  return (
    <div className="sticky top-6 border border-neutral-200 bg-white p-6">
      <CartPagePriceBreakdown
        breakdown={breakdown}
        isLoading={isLoading}
        isError={isError}
      />

      {/* Book button */}
      <Button
        onClick={onBook}
        disabled={isDisabled}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-none bg-black py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300"
      >
        Book Equipment
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>

      {/* Trust signals */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-3 bg-neutral-50 px-3 py-2.5">
          <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <p className="text-[11px] text-neutral-500">
            Payment is collected at pickup.
          </p>
        </div>
        <div className="flex items-start gap-3 bg-neutral-50 px-3 py-2.5">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <p className="text-[11px] text-neutral-500">
            You can cancel before the order is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}

type CartPagePriceBreakdownProps = {
  breakdown: CartPriceResult | undefined;
  isLoading: boolean;
  isError: boolean;
};

function CartPagePriceBreakdown({
  breakdown,
  isLoading,
  isError,
}: CartPagePriceBreakdownProps) {
  const cartItems = useCartItems();

  if (isError) {
    return (
      <div className="flex items-start gap-3 border border-red-100 bg-red-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
          Unable to compute pricing. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-black">
        Price Breakdown
      </h3>

      {/* Line items */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))
          : breakdown?.lineItems.map((item) => {
              const cartItem = cartItems.find(
                (i) => i.type === "PRODUCT" && i.productTypeId === item.id,
              );

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm text-black">{cartItem?.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                      {item.type}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-black">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              );
            })}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-neutral-200" />

      {/* Subtotal */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Subtotal</p>
        {isLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <p className="text-sm text-black">
            {breakdown ? formatCurrency(breakdown.total) : "—"}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-neutral-200" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-widest text-black">
          Total Amount
        </p>
        {isLoading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <p className="text-xl font-black text-black">
            {breakdown ? formatCurrency(breakdown.total) : "—"}
          </p>
        )}
      </div>
    </div>
  );
}
