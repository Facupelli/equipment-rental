import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/features/catalog/product-categories/categories.queries";
import { createProductsQueryOptions } from "@/features/catalog/product-types/products.queries";
import useDebounce from "@/shared/hooks/use-debounce";
import {
  getRentalProductQuerySchema,
  type RentalProductResponse,
} from "@repo/schemas";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { CalendarIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import dayjs from "@/lib/dayjs";
import { useRentalProducts } from "@/features/rental/rental.queries";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartActions } from "@/features/rental/cart/cart.hooks";
import { CartPopover } from "@/features/rental/cart/components/cart-popover";
import z from "zod";

const rentalPageSearchSchema = getRentalProductQuerySchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  locationId: z.string().optional(),
});

type RentalPageSearch = z.infer<typeof rentalPageSearchSchema>;

export const Route = createFileRoute("/_customer/rental/")({
  validateSearch: rentalPageSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    categoryId: search.categoryId,
    searchQuery: search.search,
    locationId: search.locationId,
  }),
  loader: ({ context: { queryClient }, deps }) => {
    if (!deps.locationId) {
      return null;
    }
    queryClient.ensureQueryData(createProductsQueryOptions(deps));
  },
  component: RentalPage,
});

function RentalPage() {
  const search = useSearch({ from: "/_customer/rental/" });
  const navigate = useNavigate({ from: "/rental/" });

  const [localSearch, setLocalSearch] = useState(search.search ?? "");
  const debouncedSearch = useDebounce(localSearch, 300);

  const { data: locations, isPending: isPendingLocations } = useLocations();

  function setUrlParam(patch: Partial<RentalPageSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  useEffect(() => {
    setUrlParam({ search: debouncedSearch || undefined, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function handleCategorySelect(id: string) {
    const next = search.categoryId === id ? undefined : id;
    setUrlParam({ categoryId: next, page: 1 });
  }

  function handleLocationChange(value: string | null) {
    const locationId = value === null ? undefined : value;
    setUrlParam({ locationId, page: 1 });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
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
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          <CartPopover />
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="pt-4 flex items-center gap-20">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-black/50">
                RENTAL LOCATION
              </p>
            </div>

            {isPendingLocations ? (
              <Skeleton className="h-9 w-52" />
            ) : (
              <Select
                value={search.locationId ?? "all"}
                onValueChange={(value) =>
                  handleLocationChange(value === "all" ? null : value)
                }
                items={locations?.map((location) => ({
                  label: location.name,
                  value: location.id,
                }))}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-black/50">
                RENTAL PERIOD
              </p>
            </div>
            <DateRangePicker setUrlParam={setUrlParam} />
          </div>
        </div>

        <CategoryFilter
          activeCategory={search.categoryId}
          onSelect={handleCategorySelect}
        />

        <ProductCatalog setUrlParam={setUrlParam} />
      </main>
    </div>
  );
}

function DateRangePicker({
  setUrlParam,
}: {
  setUrlParam: (patch: Partial<RentalPageSearch>) => void;
}) {
  const { startDate, endDate } = useSearch({
    from: "/_customer/rental/",
  });

  const value = {
    from: startDate,
    to: endDate,
  };

  function handleDateRangeChange(value: DateRange | undefined) {
    setUrlParam({ startDate: value?.from, endDate: value?.to });
  }

  const fromLabel = value.from
    ? dayjs(value.from).format("MM/DD/YYYY")
    : "MM/DD/YYYY";

  const toLabel = value.to
    ? dayjs(value.to).format("MM/DD/YYYY")
    : "MM/DD/YYYY";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto px-0 py-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="ml-3 flex items-center gap-2 rounded-xs bg-muted px-3 py-2">
              <span className="text-sm font-medium tabular-nums">
                {fromLabel}
              </span>
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <span className="mx-2 text-muted-foreground text-sm">→</span>

            <div className="flex items-center gap-2 rounded-xs bg-muted px-3 py-2">
              <span className="text-sm font-medium tabular-nums">
                {toLabel}
              </span>
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Button>
        }
      />

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleDateRangeChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}

function CategoryFilter({
  activeCategory,
  onSelect,
}: {
  activeCategory: string | undefined;
  onSelect: (id: string) => void;
}) {
  const { data: categories, isFetching } = useCategories();

  if (isFetching) {
    return (
      <div className="flex gap-2 py-4 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  if (!categories?.length) {
    return null;
  }

  return (
    <div className="flex gap-2 py-4 overflow-x-auto border-b scrollbar-hide">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategory === cat.id ? "default" : "ghost"}
          onClick={() => onSelect(cat.id)}
          className="rounded-full shrink-0"
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}

function ProductCatalog({
  setUrlParam,
}: {
  setUrlParam: (patch: Partial<RentalPageSearch>) => void;
}) {
  const search = useSearch({ from: "/_customer/rental/" });

  const { addProduct } = useCartActions();

  const { data: products, isPending: isPendingProducts } = useRentalProducts(
    search,
    {
      enabled: search.locationId !== undefined,
    },
  );

  function handlePageChange(page: number) {
    setUrlParam({ page });
  }

  function handleAddToCart(product: RentalProductResponse) {
    const unitPrice = product.pricingTiers[0].pricePerUnit;

    addProduct({
      name: product.name,
      billingUnitLabel: product.billingUnit.label,
      pricePerUnit: unitPrice,
      productTypeId: product.id,
      imageUrl: "",
      includedItems: product.includedItems,
    });
  }

  const currentPage = search.page ?? 1;

  const totalPages = products?.meta.totalPages ?? 1;

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Section heading                                                  */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight py-4">
          Equipment Catalog
        </h2>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {isPendingProducts
            ? "..."
            : `${products?.meta.total ?? 0} items available`}
        </Badge>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Product grid                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 py-10">
        {isPendingProducts
          ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          : products?.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
              />
            ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Pagination                                                       */}
      {/* ---------------------------------------------------------------- */}
      {!isPendingProducts && totalPages > 1 && (
        <div className="mt-4 mb-10 flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: RentalProductResponse;
  onAdd: (product: RentalProductResponse) => void;
}) {
  const unitPrice = product.pricingTiers[0].pricePerUnit;
  console.log({ product });

  const category = product.category?.name ?? "General";

  return (
    <Card className="overflow-hidden group rounded-xs">
      {/* Clickable area — navigates to detail */}
      <Link
        to="/rental/$productId"
        params={{ productId: product.id }}
        className="block"
      >
        <div className="aspect-4/3 bg-gray-100 relative overflow-hidden">
          <img
            src="/placeholder-equipment.png"
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute top-2 right-2" variant="secondary">
            {category}
          </Badge>
        </div>

        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        </CardHeader>
      </Link>

      {/* Footer — Add button isolated from navigation */}
      <CardFooter className="p-4 flex items-center justify-between ">
        <div>
          {unitPrice != null ? (
            <>
              <span className="text-lg font-bold">${unitPrice.toFixed(0)}</span>
              <span className="text-xs text-muted-foreground">
                {" "}
                / {product.billingUnit.label}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Contact us</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
        >
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-4/3" />
      <CardHeader className="p-4 pb-0">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3 mt-1" />
      </CardHeader>
      <CardFooter className="p-4 flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}

/**
 * Builds a pagination window like: [1, …, 4, 5, 6, …, 12]
 * Always shows first, last, current ± 1, and ellipses where needed.
 */
function buildPageWindow(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 1) return [];

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let d = -1; d <= 1; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      result.push("ellipsis");
    }
  }

  return result;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const window = buildPageWindow(currentPage, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {window.map((entry, i) =>
          entry === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink
                isActive={entry === currentPage}
                onClick={() => onPageChange(entry)}
                className="cursor-pointer"
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
