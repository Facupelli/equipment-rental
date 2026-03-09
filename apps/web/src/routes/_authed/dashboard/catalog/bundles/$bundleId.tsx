import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BundleDetailResponseDto } from "@repo/schemas";
import { Package, Plus } from "lucide-react";
import { createBundleDetailQueryOptions } from "@/features/catalog/bundles/bundles.queries";
import { useEffect, useState } from "react";
import {
  toAddPricingTiersDto,
  type PricingTierFormValues,
} from "@/features/catalog/pricing-tier/schemas/pricing-tier-form.schema";
import { AddPricingTierDialogForm } from "@/features/catalog/pricing-tier/components/pricing-tier-dialog-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSetPricingTiers } from "@/features/catalog/pricing-tier/pricing-tier.queries";
import { PricingTiersTable } from "@/features/catalog/pricing-tier/components/pricing-tiers-table";

export const Route = createFileRoute(
  "/_authed/dashboard/catalog/bundles/$bundleId",
)({
  loader: ({ context: { queryClient }, params: { bundleId } }) =>
    queryClient.ensureQueryData(createBundleDetailQueryOptions(bundleId)),
  component: BundleDetailPage,
});

function BundleDetailPage() {
  const { bundleId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: bundle } = useSuspenseQuery(
    createBundleDetailQueryOptions(bundleId),
  );

  const { mutateAsync: setPricingTiers } = useSetPricingTiers();

  const [pendingTiers, setPendingTiers] = useState<PricingTierFormValues[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = pendingTiers.length > 0;

  // --- In-app navigation blocker ---
  const { proceed, reset, status } = useBlocker({
    blockerFn: () => hasUnsavedChanges,
  });

  // --- Browser tab close / refresh guard ---
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
        targetType: "BUNDLE",
        targetId: bundle.id,
        tiers: pricingTiersDto.tiers,
      });
      setPendingTiers([]);
      await queryClient.invalidateQueries({
        queryKey: createBundleDetailQueryOptions(bundleId).queryKey,
      });
    } catch (error) {
      console.log({ error });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="mx-auto w-5xl space-y-8 p-8">
        <BundleHeader
          bundle={bundle}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={handleSaveChanges}
        />
        <Separator />
        <BundleComponents bundle={bundle} />
        <Separator />
        <BundlePricingTiers
          bundle={bundle}
          pendingTiers={pendingTiers}
          onOpenDialog={() => setDialogOpen(true)}
        />
      </div>

      {/* Add pricing tier dialog */}
      <AddPricingTierDialogForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        billingUnitLabel={bundle.billingUnit.label}
        onAdd={handleAddTier}
      />

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

interface BundleHeaderProps {
  bundle: BundleDetailResponseDto;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

function BundleHeader({
  bundle,
  hasUnsavedChanges,
  isSaving,
  onSave,
}: BundleHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              bundle.isActive
                ? "border-neutral-300 bg-neutral-100 text-neutral-700"
                : "border-neutral-200 text-neutral-400"
            }
          >
            {bundle.isActive ? "Active" : "Inactive"}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {bundle.billingUnit.label}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{bundle.name}</h1>
      </div>

      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        )}
      </div>
    </div>
  );
}

function BundleComponents({ bundle }: { bundle: BundleDetailResponseDto }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Bundle Components</h2>
        <p className="text-muted-foreground text-xs">
          {bundle.components.length}{" "}
          {bundle.components.length === 1 ? "product" : "products"} in this
          bundle
        </p>
      </div>

      {bundle.components.length === 0 ? (
        <EmptyState message="No components added yet." />
      ) : (
        <div className="border-border divide-border divide-y rounded-xl border">
          {bundle.components.map((component) => (
            <div
              key={component.productTypeId}
              className="flex items-center gap-4 px-4 py-3"
            >
              <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Package className="text-muted-foreground size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {component.productType.name}
                </p>
                {component.productType.description && (
                  <p className="text-muted-foreground truncate text-xs">
                    {component.productType.description}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-muted-foreground text-xs">Quantity</p>
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {String(component.quantity).padStart(2, "0")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface BundlePricingTiersProps {
  bundle: BundleDetailResponseDto;
  pendingTiers: PricingTierFormValues[];
  onOpenDialog: () => void;
}

function BundlePricingTiers({
  bundle,
  pendingTiers,
  onOpenDialog,
}: BundlePricingTiersProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Pricing Tiers</h2>
          <p className="text-muted-foreground text-xs">
            Scale price based on volume and location.
          </p>
        </div>

        <Button size="sm" onClick={onOpenDialog}>
          <Plus className="mr-1.5 size-3.5" />
          Add Pricing Tier
        </Button>
      </div>

      <PricingTiersTable
        tiers={bundle.pricingTiers.map((tier) => ({
          id: tier.id,
          fromUnit: tier.fromUnit,
          toUnit: tier.toUnit,
          pricePerUnit: tier.pricePerUnit.toString(),
          location: {
            name: tier.location?.name ?? "Global (Default)",
          },
        }))}
        pendingTiers={pendingTiers}
        billingUnitLabel={bundle.billingUnit.label}
      />
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
