import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPricingTierDialogForm } from "@/features/catalog/pricing-tier/components/pricing-tier-dialog-form";
import { useSetPricingTiers } from "@/features/catalog/pricing-tier/pricing-tier.queries";
import {
  toAddPricingTiersDto,
  type PricingTierFormValues,
} from "@/features/catalog/pricing-tier/schemas/pricing-tier-form.schema";
import { AssetsTab } from "@/features/catalog/product-types/components/detail/assets-tab";
import { PricingTab } from "@/features/catalog/product-types/components/detail/pricing-tab";
import {
  ProductProvider,
  useProduct,
} from "@/features/catalog/product-types/components/detail/product-detail.context";
import { SpecificationsTab } from "@/features/catalog/product-types/components/detail/specifications-tab";
import { formatTrackingType } from "@/features/catalog/product-types/components/products-columns";
import {
  createProductDetailQueryOptions,
  usePublishProductType,
  useRetireProductType,
} from "@/features/catalog/product-types/products.queries";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute(
  "/_admin/dashboard/catalog/products/$productId",
)({
  loader: ({ context: { queryClient }, params: { productId } }) =>
    queryClient.ensureQueryData(createProductDetailQueryOptions(productId)),
  component: RouteComponent,
});

function RouteComponent() {
  const { productId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: product } = useSuspenseQuery(
    createProductDetailQueryOptions(productId),
  );

  const { mutateAsync: setPricingTiers } = useSetPricingTiers();

  const [pendingTiers, setPendingTiers] = useState<PricingTierFormValues[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = pendingTiers.length > 0;

  const { proceed, reset, status } = useBlocker({
    blockerFn: () => hasUnsavedChanges,
  });

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function handleAddTier(tier: PricingTierFormValues) {
    setPendingTiers((prev) => [...prev, tier]);
  }

  async function handleSaveChanges() {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);

    try {
      const pricingTiersDto = toAddPricingTiersDto(pendingTiers);
      await setPricingTiers({
        targetType: "PRODUCT_TYPE",
        targetId: product.id,
        tiers: pricingTiersDto.tiers,
      });
      setPendingTiers([]);
      await queryClient.invalidateQueries({
        queryKey: createProductDetailQueryOptions(productId).queryKey,
      });
    } catch (error) {
      console.log({ error });
    } finally {
      setIsSaving(false);
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Product not found.
      </div>
    );
  }

  return (
    <>
      <ProductProvider product={product}>
        <div className="space-y-12 p-6">
          <ProductHeader />

          <Tabs
            defaultValue="specifications"
            className="flex flex-col gap-y-10"
          >
            <TabsList>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="physical-items">Physical Items</TabsTrigger>
            </TabsList>

            <TabsContent value="specifications">
              <SpecificationsTab />
            </TabsContent>

            <TabsContent value="pricing">
              <div className="flex items-center justify-between pb-4">
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-1.5 size-3.5" />
                  Add Pricing Tier
                </Button>

                {hasUnsavedChanges && (
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? "Saving…" : "Save Changes"}
                  </Button>
                )}
              </div>
              <PricingTab pendingTiers={pendingTiers} />
            </TabsContent>

            <TabsContent value="physical-items">
              <AssetsTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Add pricing tier dialog */}
        <AddPricingTierDialogForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          billingUnitLabel={product.billingUnit.label}
          onAdd={handleAddTier}
        />
      </ProductProvider>

      {/* In-app navigation blocker dialog */}
      <AlertDialog open={status === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved pricing tiers</AlertDialogTitle>
            <AlertDialogDescription>
              You have {pendingTiers.length} unsaved pricing{" "}
              {pendingTiers.length === 1 ? "tier" : "tiers"}. If you leave now,
              your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={reset}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={proceed}>
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductHeader() {
  const { product } = useProduct();

  const isPublished = product.publishedAt !== null;
  const isRetired = product.retiredAt !== null;

  const { mutate: publish, isPending: isPublishing } = usePublishProductType();
  const { mutate: retire, isPending: isRetiring } = useRetireProductType();

  return (
    <div className="flex items-start justify-between gap-8">
      {/* Left — info + actions */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2">
          {product.category && (
            <>
              <span>{product.category.name}</span>
              <span>·</span>
            </>
          )}
          <Badge variant="outline">
            {formatTrackingType(product.trackingMode)}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <LifecycleBadge isPublished={isPublished} isRetired={isRetired} />
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground max-w-prose">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 pt-6">
          {!isRetired && (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  to="/dashboard/catalog/products/$productId/edit"
                  params={{ productId: product.id }}
                >
                  Edit Details
                </Link>
              }
            />
          )}

          {!isPublished && !isRetired && (
            <Button
              onClick={() => publish({ productTypeId: product.id })}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}

          {isPublished && !isRetired && (
            <RetireConfirmDialog
              onConfirm={() => retire({ productTypeId: product.id })}
              isPending={isRetiring}
            />
          )}
        </div>
      </div>

      {/* Right — image */}
      {product.imageUrl ? (
        <img
          src={`${import.meta.env.VITE_R2_PUBLIC_URL}/${product.imageUrl}`}
          alt={product.name}
          width={320}
          height={240}
          loading="lazy"
          decoding="async"
          className="rounded-lg object-contain shrink-0 w-[320px] h-60"
        />
      ) : (
        <div className="w-[320px] h-60 rounded-lg bg-muted shrink-0 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">No image</span>
        </div>
      )}
    </div>
  );
}

function LifecycleBadge({
  isPublished,
  isRetired,
}: {
  isPublished: boolean;
  isRetired: boolean;
}) {
  if (isRetired) {
    return <Badge variant="destructive">Retired</Badge>;
  }
  if (isPublished) {
    return <Badge variant="default">Published</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}

function RetireConfirmDialog({
  onConfirm,
  isPending,
}: {
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" disabled={isPending}>
            {isPending ? "Retiring..." : "Retire"}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retire this product?</AlertDialogTitle>
          <AlertDialogDescription>
            This product will no longer appear in the rental catalog. Existing
            orders are not affected. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Retire Product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
