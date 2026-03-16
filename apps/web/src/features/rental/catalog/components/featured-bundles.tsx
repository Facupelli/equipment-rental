import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartActions } from "@/features/rental/cart/cart.hooks";
import { rentalQueries } from "@/features/rental/rental.queries";
import type { BundleItemResponse } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";

interface FeaturedBundlesProps {
  locationId?: string;
}

export function FeaturedBundles({ locationId }: FeaturedBundlesProps) {
  const { data: bundles } = useSuspenseQuery(
    rentalQueries.bundles({ locationId }),
  );

  if (!bundles.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No featured combos available.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {bundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BundleCard — co-located, only used by FeaturedBundles
// ─────────────────────────────────────────────────────────────────────────────

function BundleCard({ bundle }: { bundle: BundleItemResponse }) {
  const { addBundle } = useCartActions();
  const price = bundle.pricingPreview;

  const includedNames = bundle.components
    .map((c) => `${c.quantity}x ${c.productType.name}`)
    .join(", ");

  function handleAdd() {
    addBundle({
      bundleId: bundle.id,
      name: bundle.name,
      billingUnitLabel: bundle.billingUnit.label,
      imageUrl: "",
      price: price?.pricePerUnit ?? 0,
      components: bundle.components.map((component) => ({
        productTypeId: component.productType.id,
        name: component.productType.name,
        quantity: component.quantity,
        description: component.productType.description,
        imageUrl: "",
        includedItems: component.productType.includedItems,
      })),
    });
  }

  return (
    <Card className="overflow-hidden rounded-xs flex flex-col">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {bundle.imageUrl ? (
          <img
            src={`${import.meta.env.VITE_R2_PUBLIC_URL}/${bundle.imageUrl}`}
            alt={bundle.name}
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
          className="absolute top-2 left-2 text-[10px] uppercase tracking-widest"
          variant="secondary"
        >
          Non-modifiable bundle
        </Badge>
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">{bundle.name}</CardTitle>
          {price ? (
            <div className="text-right shrink-0">
              <span className="text-xl font-bold">
                ${price.pricePerUnit.toFixed(0)}{" "}
              </span>
              <span className="text-xs text-muted-foreground">
                / {bundle.billingUnit.label}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Contact us</span>
          )}
        </div>
        {bundle.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {bundle.description}
          </p>
        )}
        {includedNames && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Includes {includedNames}.
          </p>
        )}
      </CardHeader>

      <CardFooter className="p-4 mt-auto">
        <Button className="w-full" onClick={handleAdd}>
          Quick Reserve Combo
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — co-located, exported for Suspense fallback in the page
// ─────────────────────────────────────────────────────────────────────────────

export function FeaturedBundlesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-xs">
          <Skeleton className="aspect-video w-full" />
          <CardHeader className="p-4 pb-0">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-3 w-full mt-2" />
            <Skeleton className="h-3 w-3/4 mt-1" />
          </CardHeader>
          <CardFooter className="p-4">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
