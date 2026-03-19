import type { JoinedLineItem } from "@/features/rental/cart/hooks/use-cart-order";
import { AlertTriangle, ArrowRight, Banknote, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "../cart.utils";
import { useCartPageContext } from "../cart-page.context";
import { PRDOUCT_TYPE_DICT } from "@/features/catalog/catalog.constants";
import { cn } from "@/lib/utils";
import { useIsVisible } from "@/shared/hooks/use-is-visible";

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

  const [bookButtonRef, isBookButtonVisible] =
    useIsVisible<HTMLButtonElement>();

  return (
    <>
      {/* ── Desktop/tablet sidebar — sticky only on lg+ ── */}
      <div className="lg:sticky lg:top-6 border border-neutral-200 bg-white p-6">
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
              La reserva falló inesperadamente. Por favor, inténtalo de nuevo.
            </p>
          </div>
        )}

        <Button
          ref={bookButtonRef}
          onClick={handleBook}
          disabled={isDisabled}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-none bg-black py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300"
        >
          Alquilar Equipo
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-3 bg-neutral-50 px-3 py-2.5">
            <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <p className="text-[11px] text-neutral-500">
              El pago se cobra al retirar los equipos.
            </p>
          </div>
          <div className="flex items-start gap-3 bg-neutral-50 px-3 py-2.5">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <p className="text-[11px] text-neutral-500">
              Puedes cancelar antes de que el pedido sea confirmado.
            </p>
          </div>
        </div>
      </div>

      {/* ── Floating CTA bar — mobile only, hides when real button is visible ── */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-20",
          "border-t border-neutral-200 bg-white px-4 py-3",
          "flex items-center justify-between gap-4",
          "transition-transform duration-200",
          isBookButtonVisible ? "translate-y-full" : "translate-y-0",
        )}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Total a pagar
          </p>
          {isPriceLoading ? (
            <Skeleton className="mt-1 h-5 w-24" />
          ) : (
            <p className="text-lg font-black text-black">
              {breakdown?.total != null ? formatCurrency(breakdown.total) : "—"}
            </p>
          )}
        </div>
        <Button
          onClick={handleBook}
          disabled={isDisabled}
          className="flex items-center gap-2 rounded-none bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300"
        >
          Alquilar Equipo
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
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
          No se puede calcular el precio. Por favor, inténtalo de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-black">
        Desglose de precio
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
                    {PRDOUCT_TYPE_DICT[item.type]}
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
        <p className="text-sm font-black uppercase md:tracking-widest text-black">
          Total a pagar
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
