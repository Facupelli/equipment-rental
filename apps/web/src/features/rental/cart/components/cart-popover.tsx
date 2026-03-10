import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import {
  useCartActions,
  useCartIsEmpty,
  useCartItemCount,
  useCartItems,
} from "../cart.hooks";
import type { CartItem } from "../cart.types";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import dayjs from "@/lib/dates/dayjs";
import { useLocations } from "@/features/tenant/locations/locations.queries";

export function CartPopover() {
  const itemCount = useCartItemCount();

  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button className="relative flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white hover:bg-neutral-800">
            <span className="relative">
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-black">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Review Order
            </span>
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={8}
        className="gap-0 z-50 w-96 rounded-lg border border-neutral-200 bg-white shadow-xl"
      >
        <CartPopoverHeader onClose={close} />
        <CartPopoverContext />
        <CartPopoverItemList />
        <CartPopoverFooter onClose={close} />
      </PopoverContent>
    </Popover>
  );
}

type CartPopoverHeaderProps = {
  onClose: () => void;
};

export function CartPopoverHeader({ onClose }: CartPopoverHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
      <span className="text-xs font-bold uppercase tracking-widest text-black">
        Order
      </span>
      <button
        onClick={onClose}
        className="text-neutral-400 transition-colors hover:text-black"
        aria-label="Close cart preview"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function CartPopoverContext() {
  const { locationId, startDate, endDate } = useSearch({
    from: "/_customer/rental/",
  });
  const { data: locations } = useLocations();
  const location = locations?.find((l) => l.id === locationId);

  const formatDate = (date: Date) => {
    return dayjs(date).format("MM/DD/YYYY");
  };

  return (
    <div className="space-y-4 border-b border-neutral-200 px-5 py-6">
      <div className="flex items-start gap-4">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 pb-1">
            Pickup Location
          </p>
          {location ? (
            <p className="text-sm text-black">{location.name}</p>
          ) : (
            <p className="text-sm text-neutral-300">Not selected</p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 pb-1">
            Rental Period
          </p>
          {startDate && endDate ? (
            <p className="text-sm text-black">
              {formatDate(startDate)} — {formatDate(endDate)}
            </p>
          ) : (
            <p className="text-sm text-neutral-300">No period selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CartPopoverItemList() {
  const items = useCartItems();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
        <ShoppingBag className="h-8 w-8 text-neutral-200" />
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Your order is empty
          </p>
          <p className="mt-1 text-xs text-neutral-300">
            Browse the catalog and add equipment to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto px-5">
      <div className="divide-y divide-neutral-100">
        {items.map((item) => (
          <CartPopoverItem
            key={item.type === "PRODUCT" ? item.productTypeId : item.bundleId}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

function CartPopoverItem({ item }: { item: CartItem }) {
  const isBundle = item.type === "BUNDLE";
  const { incrementQuantity, decrementQuantity, removeItem } = useCartActions();

  const key =
    item.type === "PRODUCT"
      ? { type: "PRODUCT" as const, productTypeId: item.productTypeId }
      : { type: "BUNDLE" as const, bundleId: item.bundleId };

  const atStockLimit =
    item.type === "PRODUCT" ? item.quantity >= item.assetCount : false;

  return (
    <div className="flex items-start justify-between gap-4 py-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold uppercase tracking-wide text-black">
          {item.name}
        </p>

        {isBundle ? (
          <div className="mt-1 space-y-0.5">
            {item.components.map((component) => (
              <p
                key={component.productTypeId}
                className="text-[11px] uppercase tracking-wider text-neutral-400"
              >
                {component.name}
                {component.quantity > 1 && (
                  <span className="ml-1 text-neutral-300">
                    ×{component.quantity}
                  </span>
                )}
              </p>
            ))}
          </div>
        ) : (
          <div className="mt-0.5 flex items-center gap-1.5">
            <Package className="h-3 w-3 text-neutral-300" />
            <p className="text-[11px] uppercase tracking-wider text-neutral-400">
              {item.billingUnitLabel}
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.quantity === 1 ? (
          <button
            onClick={() => removeItem(key)}
            className="flex size-6 items-center justify-center text-neutral-300 transition-colors hover:text-red-500"
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </button>
        ) : (
          <button
            onClick={() => decrementQuantity(key)}
            className="flex size-6 items-center justify-center text-neutral-300 transition-colors hover:text-black"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
        )}

        <span className="w-4 text-center text-sm font-bold text-black">
          {item.quantity}
        </span>

        <button
          onClick={() => incrementQuantity(key)}
          disabled={atStockLimit}
          className="flex size-6 items-center justify-center text-neutral-300 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

type CartPopoverFooterProps = {
  onClose: () => void;
};

export function CartPopoverFooter({ onClose }: CartPopoverFooterProps) {
  const { locationId, startDate, endDate } = useSearch({
    from: "/_customer/rental/",
  });
  const router = useRouter();
  const isEmpty = useCartIsEmpty();

  function handleReviewOrder() {
    onClose();

    if (locationId != null) {
      router.navigate({
        to: "/cart",
        search: {
          locationId,
          startDate,
          endDate,
        },
      });
    }
  }

  return (
    <div className="border-t border-neutral-200 px-5 py-4">
      <Button
        onClick={handleReviewOrder}
        disabled={isEmpty}
        className="flex w-full items-center justify-center gap-2 py-5 rounded-none text-xs font-bold uppercase tracking-widest text-white "
      >
        Review Order
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
