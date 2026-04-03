import { createFileRoute, redirect } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartPopover } from "@/features/rental/cart/components/cart-popover";
import { RentalFilters } from "@/features/rental/catalog/components/catalog-filters";
import { CategoryFilter } from "@/features/rental/catalog/components/category-filter";
import {
	FeaturedBundles,
	FeaturedBundlesSkeleton,
} from "@/features/rental/catalog/components/featured-bundles";
import {
	NewArrivals,
	NewArrivalsSkeleton,
} from "@/features/rental/catalog/components/new-arrivals";
import {
	ProductCatalog,
	ProductCatalogSkeleton,
} from "@/features/rental/catalog/components/product-catalog";
import { SectionErrorBoundary } from "@/features/rental/catalog/components/section-error-boundary";
import {
	rentalPageSearchSchema,
	useRentalPageSearch,
} from "@/features/rental/catalog/hooks/use-catalog-page-search";
import { rentalQueries } from "@/features/rental/rental.queries";
import { rentalLocationQueries } from "@/features/tenant/locations/locations.queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_portal/_tenant/rental/")({
	validateSearch: rentalPageSearchSchema,
	loaderDeps: ({ search }) => ({
		page: search.page,
		categoryId: search.categoryId,
		searchQuery: search.search,
		locationId: search.locationId,
		startDate: search.startDate,
		endDate: search.endDate,
	}),
	loader: async ({ context: { queryClient }, deps }) => {
		const locations = await queryClient.ensureQueryData(
			rentalLocationQueries.list(),
		);

		// If the tenant has exactly one location and none is selected yet,
		// redirect with it pre-selected so the user never has to pick manually.
		// `replace: true` avoids polluting the browser history with the redirect.
		if (!deps.locationId && locations.length === 1) {
			throw redirect({
				to: "/rental",
				search: (prev) => ({ ...prev, locationId: locations[0].id }),
				replace: true,
			});
		}

		const locationId = deps.locationId;

		if (locationId && deps.startDate && deps.endDate) {
			queryClient.prefetchQuery(
				rentalQueries.bundles({
					locationId,
					startDate: deps.startDate,
					endDate: deps.endDate,
				}),
			);
		}

		queryClient.prefetchQuery(rentalQueries.newArrivals({ locationId }));

		if (locationId && deps.startDate && deps.endDate) {
			queryClient.prefetchQuery(
				rentalQueries.products({
					locationId,
					startDate: deps.startDate,
					endDate: deps.endDate,
					categoryId: deps.categoryId,
					search: deps.searchQuery,
					page: deps.page,
				}),
			);
		}
	},
	component: RentalPage,
});

function RentalPage() {
	const {
		search,
		localSearch,
		setLocalSearch,
		setUrlParam,
		handleCategorySelect,
		handleLocationChange,
	} = useRentalPageSearch();

	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<RentalHeader localSearch={localSearch} onSearchChange={setLocalSearch} />

			<main className="container mx-auto px-4">
				<RentalFilters
					search={search}
					onLocationChange={handleLocationChange}
					setUrlParam={setUrlParam}
					onCategorySelect={handleCategorySelect}
				/>

				<section className="mt-10">
					<SectionHeading
						title="Combos Destacados"
						subtitle="Combos de equipo destacados a un precio menor diario."
					/>
					<SectionErrorBoundary message="Los combos destacados no pudieron cargarse.">
						<Suspense fallback={<FeaturedBundlesSkeleton />}>
							<FeaturedBundles
								locationId={search.locationId}
								startDate={search.startDate}
								endDate={search.endDate}
							/>
						</Suspense>
					</SectionErrorBoundary>
				</section>

				<section className="mt-12">
					<SectionHeading title="Nuevos Productos" />
					<SectionErrorBoundary message="No se pudieron cargar los nuevos productos.">
						<Suspense fallback={<NewArrivalsSkeleton />}>
							<NewArrivals locationId={search.locationId} />
						</Suspense>
					</SectionErrorBoundary>
				</section>

				<section className="mt-12">
					<SectionHeading title="Todos los Equipos" />
					<CategoryFilter
						activeCategory={search.categoryId}
						onSelect={handleCategorySelect}
					/>
					<SectionErrorBoundary message="Nuestro inventario no está disponible.">
						<Suspense fallback={<ProductCatalogSkeleton />}>
							<ProductCatalog
								search={search}
								onPageChange={(page) => setUrlParam({ page })}
							/>
						</Suspense>
					</SectionErrorBoundary>
				</section>
			</main>
		</div>
	);
}

function SectionHeading({
	title,
	subtitle,
}: {
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="pb-4">
			<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
			{subtitle && (
				<p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
			)}
		</div>
	);
}

interface RentalHeaderProps {
	localSearch: string;
	onSearchChange: (value: string) => void;
}

export function RentalHeader({
	localSearch,
	onSearchChange,
}: RentalHeaderProps) {
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	return (
		<header className="sticky top-0 z-10 bg-white border-b">
			<div className="container flex items-center justify-between h-16 mx-auto px-4">
				{/* ── Logo + nav — hidden when mobile search is open ── */}
				<div
					className={cn(
						"flex items-center gap-4 transition-all",
						isSearchOpen && "hidden",
					)}
				>
					<h1 className="text-xl font-bold text-primary">DEPIQO</h1>
					<nav className="hidden md:flex gap-4 text-sm font-medium">
						<Button variant="ghost" className="text-primary">
							Rental
						</Button>
					</nav>
				</div>

				{/* ── Search bar: always visible on md+, expandable on mobile ── */}
				<div
					className={cn(
						"relative transition-all",
						// Desktop: fixed width, centered
						"md:w-full md:max-w-sm",
						// Mobile: full width when open, hidden when closed
						isSearchOpen ? "flex-1" : "hidden md:block",
					)}
				>
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Buscar equipo..."
						className="pl-8"
						value={localSearch}
						onChange={(e) => onSearchChange(e.target.value)}
						// Auto-focus when the mobile search expands
						autoFocus={isSearchOpen}
					/>
				</div>

				{/* ── Right actions ── */}
				<div className="flex items-center gap-1">
					{/* Search icon — mobile only, toggles the search bar */}
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						aria-label={isSearchOpen ? "Cerrar búsqueda" : "Buscar"}
						onClick={() => {
							setIsSearchOpen((prev) => !prev);
							// Clear the search value when closing
							if (isSearchOpen) {
								onSearchChange("");
							}
						}}
					>
						{isSearchOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Search className="h-5 w-5" />
						)}
					</Button>

					<CartPopover />
				</div>
			</div>
		</header>
	);
}
