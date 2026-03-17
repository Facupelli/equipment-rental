import z from "zod";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { CartPageProvider } from "@/features/rental/cart/cart-page.context";
import { CartPageItemList } from "@/features/rental/cart/components/cartpage-itemlist";
import { CartPageSidebar } from "@/features/rental/cart/components/cartpage-sidebar";
import { CartPagePeriod } from "@/features/rental/cart/components/cartpage-period";
import { locationQueries } from "@/features/tenant/locations/locations.queries";

const cartPageSearchSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  locationId: z.string(),
});

export const Route = createFileRoute("/_portal/cart/")({
  validateSearch: cartPageSearchSchema,
  component: CartPage,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(locationQueries.list());
  },
});

function CartPage() {
  const { startDate, endDate, locationId } = useSearch({
    from: "/_portal/cart/",
  });

  return (
    <CartPageProvider
      startDate={startDate}
      endDate={endDate}
      locationId={locationId}
    >
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

          <CartPagePeriod />

          {/*
          CSS Grid — two-column layout:
          Left column owns the content flow.
          Right column is fixed-width sticky sidebar.
          Mobile: single column, sidebar stacks below.
        */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
            <CartPageItemList />
            <CartPageSidebar />
          </div>
        </div>
      </div>
    </CartPageProvider>
  );
}
