import type { BundleItemResponse, TenantPricingConfig } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { CheckCircle, ChevronDown, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { rentalQueries } from "@/features/rental/rental.queries";
import { formatCurrency } from "@/shared/utils/price.utils";
import { useBundleCardState } from "../../cart/hooks/use-bundle-card-state";
import { useTenantPricingConfig } from "../../tenant/tenant.queries";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";
import { groupBundleComponents } from "@/features/catalog/bundles/bundles.utils";
import { BundleDetailDialog } from "./bundle-detail-dialog";

type BundlePreviewComponent = {
  id: string;
  category: {
    id: string;
    name: string;
  } | null;
  productTypeId: string;
  name: string;
  quantity: number;
};

type BundlePreviewRow =
  | {
      type: "category";
      name: string;
    }
  | {
      type: "component";
      component: BundlePreviewComponent;
    };

interface FeaturedBundlesProps {
  search: RentalPageSearch;
}

type FeaturedBundlesResultsProps = {
  search: RentalPageSearch & {
    locationId: NonNullable<RentalPageSearch["locationId"]>;
  };
};

export function FeaturedBundles({ search }: FeaturedBundlesProps) {
  if (!search.locationId) {
    return null;
  }

  return (
    <FeaturedBundlesResults
      search={{
        ...search,
        locationId: search.locationId,
      }}
    />
  );
}

function FeaturedBundlesResults({ search }: FeaturedBundlesResultsProps) {
  const { data: bundles } = useSuspenseQuery(
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
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 items-start">
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
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 items-start">
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
              type="button"
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
  const [isOpen, setIsOpen] = useState(false);

  const bundleComponents = bundle.components.map((component) => ({
    ...component.productType,
    productTypeId: component.productType.id,
    quantity: component.quantity,
  }));
  const previewRows = getBundlePreviewRows(
    groupBundleComponents(bundleComponents),
  );

  const MAX_PREVIEW_ROWS = 6;
  const [showAllItems, setShowAllItems] = useState(false);
  const hasMore = previewRows.length > MAX_PREVIEW_ROWS;
  const visibleRows = showAllItems
    ? previewRows
    : previewRows.slice(0, MAX_PREVIEW_ROWS);

  const imageBaseUrl =
    (
      import.meta as ImportMeta & {
        env?: { VITE_R2_PUBLIC_URL?: string };
      }
    ).env?.VITE_R2_PUBLIC_URL ?? "";

  function openDetails() {
    setIsOpen(true);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openDetails();
  }

  function handleToggleItems(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setShowAllItems((prev) => !prev);
  }

  function handleAddClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    handleAdd();
  }

  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    handleRemove();
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={handleCardKeyDown}
        aria-label={`Open details for ${bundle.name}`}
        className={clsx(
          "overflow-hidden rounded-xs flex cursor-pointer flex-col py-0 pb-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-black/70",
        )}
      >
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {bundle.imageUrl ? (
            <img
              src={`${imageBaseUrl}/${bundle.imageUrl}`}
              alt={bundle.name}
              loading="lazy"
              decoding="async"
              className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-muted shrink-0 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">No image</span>
            </div>
          )}
          {isInCart && (
            <Badge
              className={`absolute top-2 left-2 text-[10px] uppercase tracking-widest bg-black text-white hover:bg-black`}
              variant={isInCart ? "default" : "secondary"}
            >
              {isInCart && "Agregado"}
            </Badge>
          )}
        </div>

        <CardHeader className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg leading-tight">
              {bundle.name}
            </CardTitle>
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
          {bundle.components.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">
                Que incluye
              </p>

              <div className="relative">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {visibleRows.map((row, index) =>
                    row.type === "category" ? (
                      <p
                        key={`${bundle.id}-category-${row.name}-${index}`}
                        className="col-span-2 pt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground first:pt-0"
                      >
                        {row.name}
                      </p>
                    ) : (
                      <p
                        key={`${bundle.id}-${row.component.productTypeId}`}
                        className="min-w-0 text-xs text-muted-foreground"
                      >
                        <span className="line-clamp-1 font-medium text-foreground">
                          {row.component.quantity}x {row.component.name}
                        </span>
                      </p>
                    ),
                  )}
                </div>
                {!showAllItems && hasMore && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-background via-background/90 to-transparent" />
                )}
              </div>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleToggleItems}
                  className="h-auto px-0 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  {showAllItems ? "Ver menos" : "Ver mas"}
                  <ChevronDown
                    className={clsx(
                      "w-3 h-3 transition-transform duration-300",
                      showAllItems && "rotate-180",
                    )}
                  />
                </Button>
              )}
            </div>
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
                onClick={handleRemoveClick}
                className="shrink-0"
                aria-label="Remove from order"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={handleAddClick}>
              <Zap className="w-4 h-4 mr-2" />
              Reservar Combo
            </Button>
          )}
        </CardFooter>
      </Card>

      <BundleDetailDialog
        bundle={bundle}
        priceConfig={priceConfig}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        isInCart={isInCart}
        onAdd={handleAdd}
        onRemove={handleRemove}
        imageBaseUrl={imageBaseUrl}
      />
    </>
  );
}

function getBundlePreviewRows(
  groupedComponents: ReturnType<
    typeof groupBundleComponents<BundlePreviewComponent>
  >,
): BundlePreviewRow[] {
  const rows: BundlePreviewRow[] = [];

  for (const group of groupedComponents.categorized) {
    rows.push({
      type: "category",
      name: group.categoryName,
    });

    for (const component of group.components) {
      rows.push({
        type: "component",
        component: {
          productTypeId: component.id,
          id: component.id,
          category: component.category,
          name: component.name,
          quantity: component.quantity,
        },
      });
    }
  }

  for (const component of groupedComponents.uncategorized) {
    rows.push({
      type: "component",
      component: {
        productTypeId: component.id,
        id: component.id,
        category: component.category,
        name: component.name,
        quantity: component.quantity,
      },
    });
  }

  return rows;
}

export function FeaturedBundlesSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 items-start">
      {["featured-bundle-skeleton-1", "featured-bundle-skeleton-2"].map(
        (key) => (
          <Card
            key={key}
            className="overflow-hidden rounded-xs flex flex-col py-0 pb-4"
          >
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              <Skeleton className="h-full w-full" />
              <Skeleton className="absolute top-2 left-2 h-5 w-28 rounded-xs" />
            </div>
            <CardHeader className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="shrink-0 space-y-2 text-right">
                  <Skeleton className="ml-auto h-6 w-20" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-16" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardFooter className="p-4">
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ),
      )}
    </div>
  );
}
