import { createFileRoute, useSearch } from "@tanstack/react-router";
import type {
  CartBundleComponent,
  CartBundleItem,
  CartIncludedItem,
  CartProductItem,
} from "@/features/rental/cart/cart.types";
import {
  useCartIsEmpty,
  useCartItems,
} from "@/features/rental/cart/cart.hooks";
import type { Dayjs } from "dayjs";
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
import type { CartPriceLineItem, CartPriceResult } from "@repo/schemas";
import clsx from "clsx";
import { useCartOrder } from "@/features/rental/cart/hooks/use-cart-order";
import { formatDateShort, formatRentalDuration } from "@/lib/dates/format";
import { useLocationScheduleSlots } from "@/features/tenant/locations/location-schedules.queries";
import { ScheduleSlotType } from "@repo/types";
import dayjs from "@/lib/dates/dayjs";
import { useState, type ReactNode } from "react";

const cartPageSearchSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  locationId: z.string(),
});

export const Route = createFileRoute("/_portal/cart/")({
  validateSearch: cartPageSearchSchema,
  component: CartPage,
});

// ─── Page ────────────────────────────────────────────────────────────────────

function CartPage() {
  const { startDate, endDate, locationId } = useSearch({
    from: "/_portal/cart/",
  });

  const { data: locations } = useLocations();
  const location = locations?.find((l) => l.id === locationId);

  const [pickupTime, setPickupTime] = useState<number | undefined>(undefined);
  const [returnTime, setReturnTime] = useState<number | undefined>(undefined);

  const onPickupTimeChange = (value: number) => {
    setPickupTime(value);
  };

  const onReturnTimeChange = (value: number) => {
    setReturnTime(value);
  };

  const {
    cartItems,
    period,
    breakdown,
    isPriceLoading,
    isPriceError,
    unavailableIds,
    handleBook,
  } = useCartOrder({
    location: {
      id: locationId,
      name: location?.name ?? "—",
    },
    startDate,
    endDate,
    pickupTime,
    returnTime,
  });

  // Pre-join line items with cart item names before passing to the breakdown.
  // This keeps CartPagePriceBreakdown free of cart store knowledge.
  const joinedLineItems = breakdown?.lineItems.map((line) => {
    const cartItem = cartItems.find(
      (i) =>
        (i.type === "PRODUCT" && i.productTypeId === line.id) ||
        (i.type === "BUNDLE" && i.bundleId === line.id),
    );
    return { ...line, name: cartItem?.name ?? line.id };
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            Review Your Order
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Please check your rental details before proceeding to booking.
          </p>
        </div>

        <CartPagePeriod
          startDate={period.start}
          endDate={period.end}
          locationName={location?.name}
        >
          <TimeSelectCell
            label="Pickup Time"
            date={startDate}
            locationId={locationId}
            type={ScheduleSlotType.PICKUP}
            value={pickupTime}
            onChange={onPickupTimeChange}
          />

          <TimeSelectCell
            label="Return Time"
            date={endDate}
            locationId={locationId}
            type={ScheduleSlotType.RETURN}
            value={returnTime}
            onChange={onReturnTimeChange}
          />
        </CartPagePeriod>

        {/*
          CSS Grid — two-column layout:
          Left column owns the content flow.
          Right column is fixed-width sticky sidebar.
          Mobile: single column, sidebar stacks below.
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          <CartPageItemList
            lines={breakdown?.lineItems ?? []}
            isLoading={isPriceLoading}
            unavailableIds={unavailableIds}
          />

          <CartPageSidebar
            breakdown={breakdown}
            joinedLineItems={joinedLineItems}
            isLoading={isPriceLoading}
            isError={isPriceError}
            onBook={handleBook}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ─── Period ──────────────────────────────────────────────────────────────────

type CartPagePeriodProps = {
  children: ReactNode;
  startDate: Dayjs;
  endDate: Dayjs;
  locationName: string | undefined;
};

function CartPagePeriod({
  children,
  startDate,
  endDate,
  locationName,
}: CartPagePeriodProps) {
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
    <div className="grid grid-cols-5 divide-x divide-neutral-200 py-4">
      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Rental Period
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
          <p className="text-sm font-semibold text-black">
            {formatDateShort(startDate)} — {formatDateShort(endDate)}
          </p>
        </div>
      </div>

      {children}

      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Total Duration
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
          <p className="text-sm font-semibold text-black">
            {formatRentalDuration(startDate, endDate)}
          </p>
        </div>
      </div>
      <div className="px-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Pickup Location
        </p>
        <div className="pt-1">
          {locationName ? (
            <p className="text-sm font-semibold text-black">{locationName}</p>
          ) : (
            <p className="text-sm text-neutral-300">Not selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

type TimeSelectCellProps = {
  label: string;
  date: Date;
  locationId: string;
  type: ScheduleSlotType;
  value: number | undefined;
  onChange: (value: number) => void;
};

const formatSlot = (minutes: number): string =>
  dayjs().startOf("day").add(minutes, "minute").format("h:mm A");

function TimeSelectCell({
  label,
  date,
  locationId,
  type,
  value,
  onChange,
}: TimeSelectCellProps) {
  const { data: slots, isLoading } = useLocationScheduleSlots({
    date,
    type,
    locationId,
  });

  const isClosed = !isLoading && (!slots || slots.length === 0);

  return (
    <div className="px-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      {isClosed ? (
        <div className="mt-1 flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1">
          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            Closed
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
          <select
            disabled={isLoading}
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-transparent text-sm font-semibold text-black focus:outline-none disabled:text-neutral-300"
          >
            <option value="" disabled>
              {isLoading ? "Loading…" : "Select time"}
            </option>
            {(slots ?? []).map((slot) => (
              <option key={slot} value={slot}>
                {formatSlot(slot)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Included items ───────────────────────────────────────────────────────────

type CartPageIncludedItemsProps = {
  items: CartIncludedItem[];
};

function CartPageIncludedItems({ items }: CartPageIncludedItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 border border-neutral-100 bg-neutral-50 px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        Included with this rental
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

// ─── Image ───────────────────────────────────────────────────────────────────

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

// ─── Bundle component ─────────────────────────────────────────────────────────

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

// ─── Standalone product item ──────────────────────────────────────────────────

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
            Not available for your selected period — change dates or remove this
            item.
          </p>
        </div>
      )}

      <div className="px-4 pb-4">
        <CartPageIncludedItems items={item.includedItems} />
      </div>
    </div>
  );
}

// ─── Bundle item ──────────────────────────────────────────────────────────────

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
          Bundle
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
            Not available for your selected period — change dates or remove this
            item.
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

// ─── Item list ────────────────────────────────────────────────────────────────

type CartPageItemListProps = {
  lines: CartPriceLineItem[];
  isLoading: boolean;
  unavailableIds: string[];
};

export function CartPageItemList({
  lines,
  isLoading,
  unavailableIds,
}: CartPageItemListProps) {
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
                isUnavailable={unavailableIds.includes(item.productTypeId)}
              />
            );
          }

          return (
            <CartPageBundleItem
              key={item.bundleId}
              item={item}
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type JoinedLineItem = CartPriceLineItem & { name: string };

type CartPageSidebarProps = {
  breakdown: CartPriceResult | undefined;
  joinedLineItems: JoinedLineItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onBook: () => void;
};

function CartPageSidebar({
  breakdown,
  joinedLineItems,
  isLoading,
  isError,
  onBook,
}: CartPageSidebarProps) {
  const isEmpty = useCartIsEmpty();
  const isDisabled = isEmpty || isLoading || isError;

  return (
    <div className="sticky top-6 border border-neutral-200 bg-white p-6">
      <CartPagePriceBreakdown
        total={breakdown?.total}
        lineItems={joinedLineItems}
        isLoading={isLoading}
        isError={isError}
      />

      <Button
        onClick={onBook}
        disabled={isDisabled}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-none bg-black py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300"
      >
        Book Equipment
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>

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

// ─── Price breakdown ──────────────────────────────────────────────────────────

type CartPagePriceBreakdownProps = {
  total: number | undefined;
  lineItems: JoinedLineItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

function CartPagePriceBreakdown({
  total,
  lineItems,
  isLoading,
  isError,
}: CartPagePriceBreakdownProps) {
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

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))
          : lineItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-black">{item.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                    {item.type}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-black">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
      </div>

      <div className="my-4 border-t border-neutral-200" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Subtotal</p>
        {isLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <p className="text-sm text-black">
            {total != null ? formatCurrency(total) : "—"}
          </p>
        )}
      </div>

      <div className="my-4 border-t border-neutral-200" />

      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-widest text-black">
          Total Amount
        </p>
        {isLoading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <p className="text-xl font-black text-black">
            {total != null ? formatCurrency(total) : "—"}
          </p>
        )}
      </div>
    </div>
  );
}
