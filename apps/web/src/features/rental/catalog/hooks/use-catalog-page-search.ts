import { type RentalProductSort, rentalProductSortSchema } from "@repo/schemas";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { startTransition, useCallback, useEffect } from "react";
import z from "zod";
import { rentalLocationQueries } from "@/features/tenant/locations/locations.queries";
import { usePortalTenantId } from "@/features/tenant-context/use-portal-tenant-id";

export const rentalPageSearchSchema = z.object({
  locationId: z.string().optional(),
  pickupDate: z.iso.date().optional(),
  returnDate: z.iso.date().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  sort: rentalProductSortSchema.default("price-desc").catch("price-desc"),
  page: z.coerce.number().default(1).catch(1),
  limit: z.coerce.number().optional(),
});

export type RentalPageSearch = z.infer<typeof rentalPageSearchSchema>;

export const DEFAULT_RENTAL_PRODUCT_SORT: RentalProductSort = "price-desc";

export function useRentalPageSearch() {
  const rawSearch = useSearch({ from: "/_portal/_tenant/rental/" });
  const navigate = useNavigate({ from: "/rental/" });
  const tenantId = usePortalTenantId();

  // Cache is already warm — loader called ensureQueryData before render.
  // This hits the cache synchronously; no network request or waterfall.
  const { data: locations } = useSuspenseQuery(
    rentalLocationQueries.list(tenantId),
  );

  // Resolve locationId: URL wins when present, otherwise first location.
  // This is the only place this logic lives — no redirect needed.
  const locationId = rawSearch.locationId ?? locations[0]?.id;

  // If locationId wasn't in the URL, write it in silently.
  // This runs client-side only — no SSR redirect, no stream hang.
  // useEffect is correct here: we're syncing derived state into an external
  // system (the URL) after render, not computing a value.
  useEffect(() => {
    if (!rawSearch.locationId && locationId) {
      navigate({
        search: (prev) => ({ ...prev, locationId }),
        replace: true,
        resetScroll: false,
      });
    }
  }, [rawSearch.locationId, locationId, navigate]);

  const search: RentalPageSearch = { ...rawSearch, locationId };

  const setUrlParam = useCallback(
    (patch: Partial<RentalPageSearch>) => {
      startTransition(() => {
        navigate({
          search: (prev) => ({ ...prev, ...patch }),
          resetScroll: false,
          replace: true,
        });
      });
    },
    [navigate],
  );

  function handleCategorySelect(id: string) {
    const next = search.categoryId === id ? undefined : id;
    setUrlParam({ categoryId: next, page: 1 });
  }

  function handleLocationChange(locationId: string) {
    setUrlParam({ locationId, page: 1 });
  }

  function handleSortChange(sort: RentalProductSort) {
    setUrlParam({ sort, page: 1 });
  }

  return {
    search,
    setUrlParam,
    handleCategorySelect,
    handleLocationChange,
    handleSortChange,
  };
}
