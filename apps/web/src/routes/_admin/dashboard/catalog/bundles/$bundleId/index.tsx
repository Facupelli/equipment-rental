import type { BundleDetailResponseDto } from "@repo/schemas";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { Package, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	bundleKeys,
	bundleQueries,
	usePublishBundle,
} from "@/features/catalog/bundles/bundles.queries";
import { DeleteBundleAlertDialog } from "@/features/catalog/bundles/components/delete-bundle-alert-dialog";
import { AddPricingTierDialogForm } from "@/features/catalog/pricing-tier/components/pricing-tier-dialog-form";
import { PricingTiersTable } from "@/features/catalog/pricing-tier/components/pricing-tiers-table";
import { useSetPricingTiers } from "@/features/catalog/pricing-tier/pricing-tier.queries";
import {
	type PricingTierFormValues,
	toAddPricingTiersDto,
} from "@/features/catalog/pricing-tier/schemas/pricing-tier-form.schema";

const r2PublicUrl = (
	import.meta as unknown as {
		env: { VITE_R2_PUBLIC_URL?: string };
	}
).env.VITE_R2_PUBLIC_URL;

export const Route = createFileRoute(
	"/_admin/dashboard/catalog/bundles/$bundleId/",
)({
	loader: ({ context: { queryClient }, params: { bundleId } }) =>
		queryClient.ensureQueryData(bundleQueries.detail(bundleId)),
	component: RouteComponent,
});

function RouteComponent() {
	const { bundleId } = Route.useParams();
	const queryClient = useQueryClient();
	const { data: bundle } = useSuspenseQuery(bundleQueries.detail(bundleId));
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
			return
		}

		function handleBeforeUnload(event: BeforeUnloadEvent) {
			event.preventDefault();
		}

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [hasUnsavedChanges]);

	function handleAddTier(tier: PricingTierFormValues) {
		setPendingTiers((previous) => [...previous, tier]);
	}

	async function handleSaveChanges() {
		if (!hasUnsavedChanges) {
			return
		}

		setIsSaving(true);

		try {
			const pricingTiersDto = toAddPricingTiersDto(pendingTiers);
			await setPricingTiers({
				targetType: "BUNDLE",
				targetId: bundle.id,
				tiers: pricingTiersDto.tiers,
			})
			setPendingTiers([]);
			await queryClient.invalidateQueries({
				queryKey: bundleKeys.detail(bundleId),
			})
		} catch (error) {
			console.log({ error });
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<>
			<div className="mx-auto w-5xl px-8">
				<PageBreadcrumb
					parent={{ label: "Combos", to: "/dashboard/catalog/bundles" }}
					current={bundle.name}
				/>

				<div className="space-y-8">
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
			</div>

			<AddPricingTierDialogForm
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				billingUnitLabel={bundle.billingUnit.label}
				onAdd={handleAddTier}
			/>

			<AlertDialog open={status === "blocked"}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hay cambios sin guardar</AlertDialogTitle>
						<AlertDialogDescription>
							Tienes {pendingTiers.length} tarifa
							{pendingTiers.length === 1 ? "" : "s"} sin guardar. Si sales
							ahora, se perderan los cambios.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel onClick={reset}>Quedarme</AlertDialogCancel>
						<AlertDialogAction onClick={proceed}>
							Salir igualmente
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
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
	const isPublished = bundle.publishedAt !== null;
	const isRetired = bundle.retiredAt !== null;
	const { mutate: publish, isPending: isPublishing } = usePublishBundle();

	return (
		<div className="flex items-start justify-between gap-4">
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold tracking-tight">{bundle.name}</h1>
					<LifecycleBadge isPublished={isPublished} isRetired={isRetired} />
				</div>

				{bundle.description && <p>{bundle.description}</p>}

				<div className="flex items-center gap-2">
					{!isPublished && !isRetired && (
						<Button
							onClick={() => publish({ bundleId: bundle.id })}
							disabled={isPublishing}
						>
							{isPublishing ? "Publicando..." : "Publicar"}
						</Button>
					)}

					<Button
						variant="outline"
						render={
							<a href={`/dashboard/catalog/bundles/${bundle.id}/edit`}>
								Editar
							</a>
						}
					/>

					{isPublished && !isRetired && (
						<DeleteBundleAlertDialog
							bundleId={bundle.id}
							bundleName={bundle.name}
						/>
					)}

					{hasUnsavedChanges && (
						<Button onClick={onSave} disabled={isSaving}>
							{isSaving ? "Guardando..." : "Guardar cambios"}
						</Button>
					)}
				</div>
			</div>

			{bundle.imageUrl ? (
				<img
					src={`${r2PublicUrl}/${bundle.imageUrl}`}
					alt={bundle.name}
					width={320}
					height={240}
					loading="lazy"
					decoding="async"
					className="h-60 w-[320px] shrink-0 rounded-lg object-contain"
				/>
			) : (
				<div className="bg-muted flex h-60 w-[320px] shrink-0 items-center justify-center rounded-lg">
					<span className="text-muted-foreground text-sm">Sin imagen</span>
				</div>
			)}
		</div>
	)
}

function BundleComponents({ bundle }: { bundle: BundleDetailResponseDto }) {
	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-base font-semibold">Componentes del combo</h2>
				<p className="text-muted-foreground text-xs">
					{bundle.components.length}{" "}
					{bundle.components.length === 1 ? "producto" : "productos"} en este
					combo
				</p>
			</div>

			{bundle.components.length === 0 ? (
				<EmptyState message="Todavia no hay componentes agregados." />
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
								<p className="text-muted-foreground text-xs">Cantidad</p>
								<p className="font-mono text-sm font-semibold tabular-nums">
									{String(component.quantity).padStart(2, "0")}
								</p>
							</div>
							<div className="text-right">
								<p className="text-muted-foreground text-xs">Activos</p>
								<p className="font-mono text-sm font-semibold tabular-nums">
									{String(component.assetCount).padStart(2, "0")}
								</p>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	)
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
					<h2 className="text-base font-semibold">Tarifas</h2>
					<p className="text-muted-foreground text-xs">
						Escala precios segun volumen y ubicacion.
					</p>
				</div>

				<Button size="sm" onClick={onOpenDialog}>
					<Plus className="mr-1.5 size-3.5" />
					Agregar tarifa
				</Button>
			</div>

			<PricingTiersTable
				tiers={bundle.pricingTiers.map((tier) => ({
					id: tier.id,
					fromUnit: tier.fromUnit,
					toUnit: tier.toUnit,
					pricePerUnit: tier.pricePerUnit.toString(),
					location: {
						name: tier.location?.name ?? "General (predeterminada)",
					},
				}))}
				pendingTiers={pendingTiers}
				billingUnitLabel={bundle.billingUnit.label}
			/>
		</section>
	)
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
			<p className="text-muted-foreground text-sm">{message}</p>
		</div>
	)
}

function LifecycleBadge({
	isPublished,
	isRetired,
}: {
	isPublished: boolean;
	isRetired: boolean;
}) {
	if (isRetired) {
		return <Badge variant="destructive">Retirado</Badge>;
	}

	if (isPublished) {
		return <Badge variant="default">Publicado</Badge>;
	}

	return <Badge variant="secondary">Borrador</Badge>;
}
