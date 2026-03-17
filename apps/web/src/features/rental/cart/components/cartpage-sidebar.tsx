import type { JoinedLineItem } from "@/features/rental/cart/hooks/use-cart-order";
import { AlertTriangle, ArrowRight, Banknote, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "../cart.utils";
import { useCartPageContext } from "../cart-page.context";

export function CartPageSidebar() {
  const {
    breakdown,
    joinedLineItems,
    isPriceLoading,
    isPriceError,
    isBookingError,
    cartItems,
    handleBook,
  } = useCartPageContext();

  const isDisabled = cartItems.length === 0 || isPriceLoading || isPriceError;

  return (
    <div className="sticky top-6 border border-neutral-200 bg-white p-6">
      <CartPagePriceBreakdown
        total={breakdown?.total}
        lineItems={joinedLineItems}
        isLoading={isPriceLoading}
        isError={isPriceError}
      />

      {isBookingError && (
        <div className="mt-6 flex items-start gap-3 border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Booking failed unexpectedly. Please try again.
          </p>
        </div>
      )}

      <Button
        onClick={handleBook}
        disabled={isDisabled}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-none bg-black py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300"
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
