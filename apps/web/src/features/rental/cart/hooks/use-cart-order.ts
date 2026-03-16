import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Dayjs } from "dayjs";
import {
  useCartActions,
  useCartItems,
} from "@/features/rental/cart/cart.hooks";
import { useCartPricePreview } from "@/features/rental/rental.queries";
import { useCreateOrder } from "@/features/orders/orders.queries";
import { ProblemDetailsError } from "@/shared/errors";
import type {
  CalculateCartPricesRequest,
  CartPriceLineItem,
} from "@repo/schemas";
import { fromDate, toISOString } from "@/lib/dates/parse";

type UseCartOrderParams = {
  location: {
    id: string;
    name: string;
  };
  startDate: Date;
  endDate: Date;
  pickupTime: number | undefined;
  returnTime: number | undefined;
};

export type CartOrderPeriod = {
  start: Dayjs;
  end: Dayjs;
};

// Line item enriched with the cart item's display name.
// Computed here because this hook already owns both cartItems and breakdown —
// the page component shouldn't need to know about either to render the sidebar.
export type JoinedLineItem = CartPriceLineItem & { name: string };

/**
 * Owns all data-fetching and mutation logic for the cart page.
 *
 * Responsibilities:
 * - Convert native Date params to dayjs once (Layer 1 → Layer 2)
 * - Build the shared item payload (once, shared between preview + submit)
 * - Fetch the price preview
 * - Join line items with cart item names (so views don't touch the cart store)
 * - Submit the order and navigate on success
 * - Track unavailable item IDs on 422 errors
 */
export function useCartOrder({
  location,
  startDate,
  endDate,
  pickupTime,
  returnTime,
}: UseCartOrderParams) {
  const navigate = useNavigate();
  const cartItems = useCartItems();
  const { clearCart } = useCartActions();
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);

  // Layer boundary: native Date → dayjs, once.
  // All downstream logic and transport use these dayjs instances.
  const period: CartOrderPeriod = useMemo(
    () => ({ start: fromDate(startDate), end: fromDate(endDate) }),
    [startDate, endDate],
  );

  // Built once — reused for both the price preview query and the order mutation.
  const itemPayload = useMemo(
    () =>
      cartItems.map((item) =>
        item.type === "PRODUCT"
          ? {
              type: "PRODUCT" as const,
              productTypeId: item.productTypeId,
              quantity: item.quantity,
            }
          : {
              type: "BUNDLE" as const,
              bundleId: item.bundleId,
              quantity: item.quantity,
            },
      ),
    [cartItems],
  );

  const pricePreviewRequest: CalculateCartPricesRequest = {
    currency: "USD",
    locationId: location.id,
    period: {
      start: toISOString(period.start),
      end: toISOString(period.end),
    },
    items: itemPayload,
  };

  const {
    data: breakdown,
    isPending: isPriceLoading,
    isError: isPriceError,
  } = useCartPricePreview(pricePreviewRequest, {
    enabled: Boolean(startDate && endDate && location.id),
  });

  // Pre-join line items with cart item names so downstream components
  // don't need to know about the cart store or the breakdown shape.
  const joinedLineItems: JoinedLineItem[] | undefined = useMemo(
    () =>
      breakdown?.lineItems.map((line) => {
        const cartItem = cartItems.find(
          (i) =>
            (i.type === "PRODUCT" && i.productTypeId === line.id) ||
            (i.type === "BUNDLE" && i.bundleId === line.id),
        );
        return { ...line, name: cartItem?.name ?? line.id };
      }),
    [breakdown, cartItems],
  );

  const { mutateAsync: createOrder } = useCreateOrder();

  const handleBook = async () => {
    setUnavailableIds([]);

    if (!pickupTime || !returnTime) {
      throw new ProblemDetailsError({
        type: "errors://validation-error",
        title: "Validation Failed",
        status: 422,
        detail: "Pickup and return times are required.",
      });
    }

    try {
      await createOrder({
        locationId: location.id,
        customerId: undefined,
        periodStart: toISOString(period.start),
        periodEnd: toISOString(period.end),
        currency: "USD",
        items: itemPayload,
        pickupTime,
        returnTime,
      });

      clearCart();

      navigate({
        to: "/order-confirmation",
        search: {
          pickupDate: period.start.format("YYYY-MM-DD"),
          pickupLocation: location.name,
        },
      });
    } catch (error) {
      if (
        error instanceof ProblemDetailsError &&
        error.problemDetails.status === 422
      ) {
        const ids = (error.problemDetails.unavailableItems ?? []).map(
          (i: { productTypeId?: string; bundleId?: string }) =>
            i.productTypeId ?? i.bundleId ?? "",
        );
        setUnavailableIds(ids.filter(Boolean));
        return;
      }

      throw error;
    }
  };

  return {
    cartItems,
    period,
    breakdown,
    joinedLineItems,
    isPriceLoading,
    isPriceError,
    unavailableIds,
    handleBook,
  };
}
