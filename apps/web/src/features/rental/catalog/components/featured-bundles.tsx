import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { rentalQueries } from "@/features/rental/rental.queries";
import type { BundleItemResponse, TenantPricingConfig } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { useBundleCardState } from "../../cart/hooks/use-bundle-card-state";
import { CheckCircle, ChevronDown, Trash2, Zap } from "lucide-react";
import clsx from "clsx";
import { useTenantPricingConfig } from "../../tenant/tenant.queries";
import { formatCurrency } from "@/shared/utils/price.utils";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";
import { useState } from "react";

interface FeaturedBundlesProps {
  search: RentalPageSearch;
}

export function FeaturedBundles({ search }: FeaturedBundlesProps) {
  if (!search.locationId) {
    return null;
  }

  return <FeaturedBundlesResults search={search} />;
}

function FeaturedBundlesResults({ search }: FeaturedBundlesProps) {
  const { data: bundles } = useQuery(
    rentalQueries.bundles({
      locationId: search.locationId,
      startDate: search.startDate,
      endDate: search.endDate,
    }),
  );

  const { data: tenantPriceConfig } = useTenantPricingConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!bundles?.length) return null;

  const sorted = [...bundles].sort(
    (a, b) => b.components.length - a.components.length,
  );
  const featured = sorted.slice(0, 3);
  const regular = sorted.slice(3);
  const COLLAPSED_COUNT = 4;
  const visibleRegular = isExpanded
    ? regular
    : regular.slice(0, COLLAPSED_COUNT);
  const hasHidden = regular.length > COLLAPSED_COUNT;

  return (
    <div className="flex flex-col gap-6">
      {/* Featured row */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {featured.map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            priceConfig={tenantPriceConfig}
          />
        ))}
      </div>

      {/* Regular rows */}
      {regular.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {visibleRegular.map((bundle, index) => (
              <div
                key={bundle.id}
                className={clsx(
                  "transition-all duration-300 ease-out",
                  index >= COLLAPSED_COUNT
                    ? "animate-in fade-in slide-in-from-bottom-4"
                    : "",
                )}
              >
                <BundleCard bundle={bundle} priceConfig={tenantPriceConfig} />
              </div>
            ))}
          </div>

          {hasHidden && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex items-center gap-2 mx-auto text-xs uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? "Ver menos" : "Ver todos los combos"}
              <ChevronDown
                className={clsx(
                  "w-4 h-4 transition-transform duration-300",
                  isExpanded && "rotate-180",
                )}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BundleCard({
  bundle,
  priceConfig,
}: {
  bundle: BundleItemResponse;
  priceConfig: TenantPricingConfig;
}) {
  const { isInCart, handleAdd, handleRemove } = useBundleCardState(bundle);
  const price = bundle.pricingPreview;

  const includedNames = bundle.components
    .map((c) => `${c.quantity}x ${c.productType.name}`)
    .join(", ");

  return (
    <Card
      className={clsx(
        "overflow-hidden rounded-xs flex flex-col py-0 pb-4 transition-all",
        isInCart && "ring-2 ring-black ",
      )}
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

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">{bundle.name}</CardTitle>
          {price ? (
            <div className="text-right shrink-0">
              <span className="text-xl font-bold">
                {formatCurrency(
                  price.pricePerUnit,
                  priceConfig.currency,
                  priceConfig.locale,
                )}{" "}
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

      <CardFooter>
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
