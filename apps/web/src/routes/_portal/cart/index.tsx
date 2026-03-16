import { createFileRoute, useSearch } from "@tanstack/react-router";
import z from "zod";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useCartOrder } from "@/features/rental/cart/hooks/use-cart-order";
import { ScheduleSlotType } from "@repo/types";
import { useState } from "react";
import { CartPageItemList } from "@/features/rental/cart/components/cartpage-itemlist";
import { CartPageSidebar } from "@/features/rental/cart/components/cartpage-sidebar";
import {
  CartPagePeriod,
  TimeSelectCell,
} from "@/features/rental/cart/components/cartpage-period";

const cartPageSearchSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  locationId: z.string(),
});

export const Route = createFileRoute("/_portal/cart/")({
  validateSearch: cartPageSearchSchema,
  component: CartPage,
});

function CartPage() {
  const { startDate, endDate, locationId } = useSearch({
    from: "/_portal/cart/",
  });

  const { data: locations } = useLocations();
  const location = locations?.find((l) => l.id === locationId);

  const [pickupTime, setPickupTime] = useState<number | undefined>(undefined);
  const [returnTime, setReturnTime] = useState<number | undefined>(undefined);

  const {
    cartItems,
    period,
    breakdown,
    joinedLineItems,
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
            onChange={setPickupTime}
          />
          <TimeSelectCell
            label="Return Time"
            date={endDate}
            locationId={locationId}
            type={ScheduleSlotType.RETURN}
            value={returnTime}
            onChange={setReturnTime}
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
            items={cartItems}
            lines={breakdown?.lineItems ?? []}
            isLoading={isPriceLoading}
            unavailableIds={unavailableIds}
          />

          <CartPageSidebar
            breakdown={breakdown}
            joinedLineItems={joinedLineItems}
            isLoading={isPriceLoading}
            isError={isPriceError}
            isEmpty={cartItems.length === 0}
            onBook={handleBook}
          />
        </div>
      </div>
    </div>
  );
}
