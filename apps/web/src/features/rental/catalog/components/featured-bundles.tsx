import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { rentalQueries } from "@/features/rental/rental.queries";
import type { BundleItemResponse } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useBundleCardState } from "../../cart/hooks/use-bundle-card-state";
import { CheckCircle, Trash2, Zap } from "lucide-react";

interface FeaturedBundlesProps {
  locationId?: string;
}

export function FeaturedBundles({ locationId }: FeaturedBundlesProps) {
  const { data: bundles } = useSuspenseQuery(
    rentalQueries.bundles({ locationId }),
  );

  if (!bundles.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {bundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}

function BundleCard({ bundle }: { bundle: BundleItemResponse }) {
  const { isInCart, handleAdd, handleRemove } = useBundleCardState(bundle);
  const price = bundle.pricingPreview;

  const includedNames = bundle.components
    .map((c) => `${c.quantity}x ${c.productType.name}`)
    .join(", ");

  return (
    <Card
      className={`overflow-hidden rounded-xs flex flex-col transition-all ${
        isInCart ? "ring-2 ring-black" : ""
      }`}
    >
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
          className={`absolute top-2 left-2 text-[10px] uppercase tracking-widest ${
            isInCart ? "bg-black text-white hover:bg-black" : ""
          }`}
          variant={isInCart ? "default" : "secondary"}
        >
          {isInCart ? "Agregado" : "Combo no modificable"}
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
            <span className="text-sm text-muted-foreground">Contactanos</span>
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
        {isInCart ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Reserved
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRemove}
              className="shrink-0"
              aria-label="Remove from order"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={handleAdd}>
            <Zap className="w-4 h-4 mr-2" />
            Reservar Combo
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

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
