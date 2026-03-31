import type { JoinedLineItem } from "@/features/rental/cart/hooks/use-cart-order";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Tag,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computeOriginalSubtotal, formatDiscount } from "../cart.utils";
import { useCartPageContext } from "../cart-page.context";
import { PRDOUCT_TYPE_DICT } from "@/features/catalog/catalog.constants";
import { cn } from "@/lib/utils";
import { useIsVisible } from "@/shared/hooks/use-is-visible";
import type { CartDiscountLineItem, TenantPricingConfig } from "@repo/schemas";
import { formatCurrency } from "@/shared/utils/price.utils";
import { useTenantPricingConfig } from "../../tenant/tenant.queries";

export function CartPageSidebar() {
  const { data: tenantPriceConfig } = useTenantPricingConfig();

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
          totalBeforeDiscounts={breakdown?.totalBeforeDiscounts}
          totalDiscount={breakdown?.totalDiscount}
          lineItems={joinedLineItems}
          isLoading={isPriceLoading}
          isError={isPriceError}
          priceConfig={tenantPriceConfig}
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
              {breakdown?.total != null
                ? formatCurrency(
                    breakdown.total,
                    tenantPriceConfig.currency,
                    tenantPriceConfig.locale,
                  )
                : "—"}
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

// ── CartPagePriceBreakdown ─────────────────────────────────────────────────────
// Orchestrator. Composes the line items, subtotal, discount deduction,
// total, and savings banner. Shows pre-discount subtotal only when relevant.

type CartPagePriceBreakdownProps = {
  total: number | undefined;
  totalBeforeDiscounts: number | undefined;
  totalDiscount: number | undefined;
  lineItems: JoinedLineItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  priceConfig: TenantPricingConfig;
};

export function CartPagePriceBreakdown({
  total,
  totalBeforeDiscounts,
  totalDiscount,
  lineItems,
  isLoading,
  isError,
  priceConfig,
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

  const hasSavings = (totalDiscount ?? 0) > 0;

  return (
    <div>
      <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-black">
        Desglose de precio
      </h3>

      {/* Line items */}
      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))
          : lineItems?.map((item) => (
              <LineItemRow
                key={item.id}
                item={item}
                priceConfig={priceConfig}
              />
            ))}
      </div>

      <div className="my-4 border-t border-neutral-200" />

      {/* Subtotal row — shows pre-discount amount when savings exist */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Subtotal</p>
        {isLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <p className="text-sm text-black">
            {hasSavings && totalBeforeDiscounts != null
              ? formatCurrency(
                  totalBeforeDiscounts,
                  priceConfig.currency,
                  priceConfig.locale,
                )
              : total != null
                ? formatCurrency(
                    total,
                    priceConfig.currency,
                    priceConfig.locale,
                  )
                : "—"}
          </p>
        )}
      </div>

      {/* Discount deduction row — only visible when savings exist */}
      {!isLoading && hasSavings && totalDiscount != null && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-green-700">Descuentos aplicados</p>
          <p className="text-sm font-semibold text-green-700">
            {`\u2212${formatCurrency(totalDiscount, priceConfig.currency, priceConfig.locale)}`}
          </p>
        </div>
      )}

      <div className="my-4 border-t border-neutral-200" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase md:tracking-widest text-black">
          Total a pagar
        </p>
        {isLoading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <p className="text-xl font-black text-black">
            {total != null
              ? formatCurrency(total, priceConfig.currency, priceConfig.locale)
              : "—"}
          </p>
        )}
      </div>

      {/* Savings banner — only visible when savings exist */}
      {!isLoading && hasSavings && totalDiscount != null && (
        <div className="-mx-6 mt-4">
          <SavingsBanner
            totalDiscount={totalDiscount}
            priceConfig={priceConfig}
          />
        </div>
      )}
    </div>
  );
}

type DiscountTagProps = {
  discount: CartDiscountLineItem;
};

function DiscountTag({ discount }: DiscountTagProps) {
  return (
    <div className="inline-flex items-center gap-1.5 border-l-2 border-green-500 bg-green-50 pl-2 pr-2.5 py-0.5">
      <Tag className="h-2.5 w-2.5 shrink-0 text-green-600" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700">
        {discount.ruleLabel}
      </span>
      <span className="text-[10px] font-black text-green-700">
        {formatDiscount(discount)}
      </span>
    </div>
  );
}

// ── LineItemRow ────────────────────────────────────────────────────────────────
// Renders one cart line item with its name, type badge, discount tags,
// and price — showing a strikethrough original when discounts apply.

type LineItemRowProps = {
  item: JoinedLineItem;
  priceConfig: TenantPricingConfig;
};

function LineItemRow({ item, priceConfig }: LineItemRowProps) {
  const hasDiscounts = item.discounts.length > 0;
  const originalSubtotal = hasDiscounts ? computeOriginalSubtotal(item) : null;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-black">{item.name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {PRDOUCT_TYPE_DICT[item.type]}
        </p>
        {hasDiscounts && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.discounts.map((discount) => (
              <DiscountTag key={discount.ruleId} discount={discount} />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {originalSubtotal != null && (
          <span className="text-xs text-neutral-400 line-through">
            {formatCurrency(
              originalSubtotal,
              priceConfig.currency,
              priceConfig.locale,
            )}
          </span>
        )}
        <span className="text-sm font-semibold text-black">
          {formatCurrency(
            item.subtotal,
            priceConfig.currency,
            priceConfig.locale,
          )}
        </span>
      </div>
    </div>
  );
}

// ── SavingsBanner ──────────────────────────────────────────────────────────────
// Full-width row shown only when there are active discounts.
// Stark and typography-forward — no bubble, no emoji — matches the system tone.

type SavingsBannerProps = {
  totalDiscount: number;
  priceConfig: TenantPricingConfig;
};

function SavingsBanner({ totalDiscount, priceConfig }: SavingsBannerProps) {
  return (
    <div className="flex items-center justify-between border-t-2 border-green-500 bg-green-50 px-4 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700">
        Ahorraste en este pedido
      </p>
      <p className="text-sm font-black text-green-700">
        {formatCurrency(
          totalDiscount,
          priceConfig.currency,
          priceConfig.locale,
        )}
      </p>
    </div>
  );
}
