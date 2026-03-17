import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useRentalProducts } from "@/features/rental/rental.queries";
import type { RentalProductResponse } from "@repo/schemas";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";
import { useProductCardState } from "../../cart/hooks/use-product-card-state";
import { Minus, Plus } from "lucide-react";

interface ProductCatalogProps {
  search: RentalPageSearch;
  onPageChange: (page: number) => void;
}

export function ProductCatalog({ search, onPageChange }: ProductCatalogProps) {
  const { data: products } = useRentalProducts(search);

  const currentPage = search.page ?? 1;
  const totalPages = products?.meta.totalPages ?? 1;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 py-10">
        {products?.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 mb-10 flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}

function ProductCard({ product }: { product: RentalProductResponse }) {
  const {
    isInCart,
    quantity,
    maxQuantity,
    handleAdd,
    handleIncrement,
    handleDecrement,
  } = useProductCardState(product);

  const unitPrice = product.pricingTiers[0].pricePerUnit;
  const category = product.category?.name ?? "General";

  return (
    <Card className="overflow-hidden rounded-xs">
      <div className="aspect-4/3 bg-gray-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={`${import.meta.env.VITE_R2_PUBLIC_URL}/${product.imageUrl}`}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-muted shrink-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}
        <Badge
          className="absolute top-2 right-2"
          variant={isInCart ? "default" : "secondary"}
        >
          {isInCart ? "Added" : category}
        </Badge>
      </div>

      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>
      </CardHeader>

      <CardFooter className="p-4 flex items-center justify-between">
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

        {isInCart ? (
          <div className="flex items-center gap-2 border rounded-md px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium w-4 text-center">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleAdd}>
            Add
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function ProductCatalogSkeleton() {
  return Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />);
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
  const pageWindow = buildPageWindow(currentPage, totalPages);

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

        {pageWindow.map((entry, i) =>
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
