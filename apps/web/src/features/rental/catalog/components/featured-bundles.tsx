import type { BundleItemResponse, TenantPricingConfig } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { CheckCircle, ChevronDown, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { rentalQueries } from "@/features/rental/rental.queries";
import { formatCurrency } from "@/shared/utils/price.utils";
import { useBundleCardState } from "../../cart/hooks/use-bundle-card-state";
import { useTenantPricingConfig } from "../../tenant/tenant.queries";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";

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
			<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start">
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
					<div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 items-start">
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
	const [showAllItems, setShowAllItems] = useState(false);
	const PREVIEW_ITEM_COUNT = 6;
	const imageBaseUrl =
		(
			import.meta as ImportMeta & {
				env?: { VITE_R2_PUBLIC_URL?: string };
			}
		).env?.VITE_R2_PUBLIC_URL ?? "";
	const visibleComponents = showAllItems
		? bundle.components
		: bundle.components.slice(0, PREVIEW_ITEM_COUNT);
	const hasHiddenComponents = bundle.components.length > PREVIEW_ITEM_COUNT;

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
					isInCart && "ring-2 ring-black",
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
					<Badge
						className={`absolute top-2 left-2 text-[10px] uppercase tracking-widest ${
							isInCart ? "bg-black text-white hover:bg-black" : ""
						}`}
						variant={isInCart ? "default" : "secondary"}
					>
						{isInCart ? "Agregado" : "Combo no modificable"}
					</Badge>
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
							<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
								{visibleComponents.map((component) => (
									<p
										key={`${bundle.id}-${component.productType.id}`}
										className="min-w-0 text-xs text-muted-foreground"
									>
										<span className="line-clamp-1 font-medium text-foreground">
											{component.quantity}x {component.productType.name}
										</span>
									</p>
								))}
							</div>
							{hasHiddenComponents && (
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

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="overflow-hidden p-0 sm:max-w-5xl">
					<div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:max-h-[70vh]">
						<div className="h-full lg:sticky lg:top-0 lg:self-start">
							<div className="relative w-full flex items-center justify-center border-r p-6 lg:h-full ">
								{bundle.imageUrl ? (
									<img
										src={`${imageBaseUrl}/${bundle.imageUrl}`}
										alt={bundle.name}
										className="max-h-105 w-full object-contain lg:max-h-155"
									/>
								) : (
									<div className="flex h-full min-h-70 w-full items-center justify-center bg-muted">
										<span className="text-sm text-muted-foreground">
											No image
										</span>
									</div>
								)}
								<div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
									{isInCart && (
										<Badge className="rounded-xs bg-black px-2 py-1 text-[10px] uppercase tracking-widest text-white hover:bg-black">
											Agregado
										</Badge>
									)}
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-4 p-5 lg:p-6 lg:max-h-[80vh] lg:overflow-y-auto">
							<DialogHeader className="gap-2">
								<div className="space-y-2">
									<p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
										Detalle del combo
									</p>
									<DialogTitle className="text-3xl font-semibold leading-tight">
										{bundle.name}
									</DialogTitle>
								</div>
								{bundle.description && (
									<DialogDescription className="text-sm leading-6 text-muted-foreground">
										{bundle.description}
									</DialogDescription>
								)}
							</DialogHeader>

							<div className="grid gap-2 sm:grid-cols-2">
								<div className="rounded-lg border bg-muted/20 p-3">
									<p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
										Precio por {bundle.billingUnit.label.toLowerCase()}
									</p>
									<p className="mt-2 text-2xl font-semibold leading-none">
										{price
											? formatCurrency(
													price.pricePerUnit,
													priceConfig.currency,
													priceConfig.locale,
												)
											: "Contactanos"}
									</p>
								</div>
								<div className="rounded-lg border bg-muted/20 p-3">
									<p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
										Componentes
									</p>
									<p className="mt-2 text-2xl font-semibold leading-none">
										{bundle.components.length}
									</p>
								</div>
							</div>

							<div className="rounded-lg border bg-muted/10 p-3">
								<p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
									Que incluye
								</p>
								<div className="space-y-2">
									{bundle.components.map((component) => (
										<div
											key={`${bundle.id}-dialog-${component.productType.id}`}
											className="rounded-md border bg-background p-3"
										>
											<div className="flex items-start justify-between gap-4">
												<div>
													<p className="text-sm font-semibold text-foreground">
														{component.quantity}x {component.productType.name}
													</p>
													{component.productType.description && (
														<p className="mt-1 text-sm leading-6 text-muted-foreground">
															{component.productType.description}
														</p>
													)}
												</div>
												<Badge
													variant="secondary"
													className="shrink-0 rounded-xs text-[10px] uppercase tracking-widest"
												>
													Qty {component.quantity}
												</Badge>
											</div>
											{component.productType.includedItems.length > 0 && (
												<div className="mt-4 rounded-md border bg-muted/30 px-3 py-3">
													<p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
														Incluye tambien
													</p>
													<div className="flex flex-wrap gap-x-5 gap-y-2">
														{component.productType.includedItems.map(
															(item, index) => (
																<div
																	key={`${component.productType.id}-${item.name}-${index}`}
																	className="flex items-start gap-2"
																>
																	<CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
																	<div className="text-xs text-muted-foreground">
																		<p>
																			{item.name}
																			{item.quantity > 1 && (
																				<span className="ml-1">
																					x{item.quantity}
																				</span>
																			)}
																		</p>
																		{item.notes && (
																			<p className="mt-0.5">{item.notes}</p>
																		)}
																	</div>
																</div>
															),
														)}
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							</div>

							<DialogFooter className="border-t pt-4 sm:justify-between">
								{isInCart ? (
									<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<Button variant="outline" disabled>
											<CheckCircle className="mr-2 h-4 w-4" />
											Reservedo
										</Button>
										<Button variant="outline" onClick={handleRemove}>
											<Trash2 className="mr-2 h-4 w-4" />
											Quitar del pedido
										</Button>
									</div>
								) : (
									<Button className="w-full sm:w-auto" onClick={handleAdd}>
										<Zap className="mr-2 h-4 w-4" />
										Reservar Combo
									</Button>
								)}
							</DialogFooter>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function FeaturedBundlesSkeleton() {
	return (
		<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start">
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
