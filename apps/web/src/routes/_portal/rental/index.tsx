import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartPopover } from "@/features/rental/cart/components/cart-popover";
import { RentalFilters } from "@/features/rental/catalog/components/catalog-filters";
import { CategoryFilter } from "@/features/rental/catalog/components/category-filter";
import {
  FeaturedBundles,
  FeaturedBundlesSkeleton,
} from "@/features/rental/catalog/components/featured-bundles";
import {
  NewArrivals,
  NewArrivalsSkeleton,
} from "@/features/rental/catalog/components/new-arrivals";
import {
  ProductCatalog,
  ProductCatalogSkeleton,
} from "@/features/rental/catalog/components/product-catalog";
import { SectionErrorBoundary } from "@/features/rental/catalog/components/section-error-boundary";
import {
  rentalPageSearchSchema,
  useRentalPageSearch,
} from "@/features/rental/catalog/hooks/use-catalog-page-search";
import { rentalQueries } from "@/features/rental/rental.queries";
import { locationQueries } from "@/features/tenant/locations/locations.queries";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/_portal/rental/")({
  validateSearch: rentalPageSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    categoryId: search.categoryId,
    searchQuery: search.search,
    locationId: search.locationId,
  }),
  loader: async ({ context: { queryClient }, deps }) => {
    const locations = await queryClient.ensureQueryData(locationQueries.list());

    // If the tenant has exactly one location and none is selected yet,
    // redirect with it pre-selected so the user never has to pick manually.
    // `replace: true` avoids polluting the browser history with the redirect.
    if (!deps.locationId && locations.length === 1) {
      throw redirect({
        to: "/rental",
        search: (prev) => ({ ...prev, locationId: locations[0].id }),
        replace: true,
      });
    }

    const locationId = deps.locationId;

    queryClient.prefetchQuery(rentalQueries.bundles({ locationId }));
    queryClient.prefetchQuery(rentalQueries.newArrivals({ locationId }));

    if (locationId) {
      queryClient.prefetchQuery(rentalQueries.products(deps));
    }
  },
  component: RentalPage,
});

function RentalPage() {
  const {
    search,
    localSearch,
    setLocalSearch,
    setUrlParam,
    handleCategorySelect,
    handleLocationChange,
  } = useRentalPageSearch();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <RentalHeader localSearch={localSearch} onSearchChange={setLocalSearch} />

      <main className="container mx-auto px-4">
        <RentalFilters
          search={search}
          onLocationChange={handleLocationChange}
          setUrlParam={setUrlParam}
        />

        <section className="mt-10">
          <SectionHeading
            title="Featured Combos"
            subtitle="Curated equipment bundles at a lower daily rate."
          />
          <SectionErrorBoundary message="Featured bundles could not be loaded.">
            <Suspense fallback={<FeaturedBundlesSkeleton />}>
              <FeaturedBundles locationId={search.locationId} />
            </Suspense>
          </SectionErrorBoundary>
        </section>

        <section className="mt-12">
          <SectionHeading title="New Arrivals" />
          <SectionErrorBoundary message="New arrivals could not be loaded.">
            <Suspense fallback={<NewArrivalsSkeleton />}>
              <NewArrivals locationId={search.locationId} />
            </Suspense>
          </SectionErrorBoundary>
        </section>

        <section className="mt-12">
          <SectionHeading title="Browse All Equipment" />
          <CategoryFilter
            activeCategory={search.categoryId}
            onSelect={handleCategorySelect}
          />
          <SectionErrorBoundary message="Our inventory database is currently unreachable.">
            <Suspense fallback={<ProductCatalogSkeleton />}>
              <ProductCatalog
                search={search}
                onPageChange={(page) => setUrlParam({ page })}
              />
            </Suspense>
          </SectionErrorBoundary>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

interface RentalHeaderProps {
  localSearch: string;
  onSearchChange: (value: string) => void;
}

export function RentalHeader({
  localSearch,
  onSearchChange,
}: RentalHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="container flex items-center justify-between h-16 mx-auto px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">EQUIP</h1>
          <nav className="hidden md:flex gap-4 text-sm font-medium">
            <Button variant="ghost" className="text-muted-foreground">
              Home
            </Button>
            <Button variant="ghost" className="text-primary">
              Rental
            </Button>
          </nav>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search equipment..."
            className="pl-8"
            value={localSearch}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <CartPopover />
      </div>
    </header>
  );
}
