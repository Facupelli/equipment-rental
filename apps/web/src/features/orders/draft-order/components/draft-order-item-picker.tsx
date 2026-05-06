import type { BundleItemResponse, RentalProductResponse } from "@repo/schemas";
import { Loader2, PackageSearch, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	useDraftOrderItems,
	useDraftOrderPricing,
	useDraftOrderRentalPeriod,
} from "@/features/orders/draft-order/draft-order.context";
import {
	useDraftOrderRentalBundles,
	useDraftOrderRentalProducts,
} from "@/features/orders/draft-order/draft-order-composer.queries";
import { formatMoney } from "@/features/orders/order.utils";
import type { OrderEditorMode } from "@/features/orders/order-editor/types/order-editor.types";
import { getOrderEditorCopy } from "@/features/orders/order-editor/utils/order-editor-copy";
import { useCurrentTenant } from "@/features/tenant/tenant.queries";
import { useLocationId } from "@/shared/contexts/location/location.hooks";
import useDebounce from "@/shared/hooks/use-debounce";

type ItemTab = "ALL" | "PRODUCT" | "BUNDLE";

export function DraftOrderItemPicker({
	mode = "edit-draft",
}: {
	mode?: OrderEditorMode;
}) {
	const copy = getOrderEditorCopy(mode);
	const locationId = useLocationId();
	const { data: tenant } = useCurrentTenant();
	const { currency } = useDraftOrderPricing();
	const { rentalPeriod } = useDraftOrderRentalPeriod();
	const { items, addProductItem, addBundleItem } = useDraftOrderItems();
	const [search, setSearch] = useState("");
	const [activeTab, setActiveTab] = useState<ItemTab>("ALL");

	const debouncedSearch = useDebounce(search, 300);
	const normalizedSearch = debouncedSearch.trim();
	const isPeriodReady = hasCompleteRentalPeriod(rentalPeriod);
	const tenantCurrency = tenant?.config.pricing.currency ?? currency;
	const productSearchEnabled =
		isPeriodReady && Boolean(locationId) && activeTab !== "BUNDLE";
	const bundleSearchEnabled =
		isPeriodReady && Boolean(locationId) && activeTab !== "PRODUCT";

	const productQuery = useDraftOrderRentalProducts(
		{
			locationId: locationId ?? "00000000-0000-0000-0000-000000000000",
			pickupDate: rentalPeriod.pickupDate ?? undefined,
			returnDate: rentalPeriod.returnDate ?? undefined,
			search: normalizedSearch || undefined,
			page: 1,
			limit: 8,
			sort: "alphabetical",
		},
		{
			enabled: productSearchEnabled,
		},
	);

	const bundleQuery = useDraftOrderRentalBundles(
		{
			locationId: locationId ?? "00000000-0000-0000-0000-000000000000",
			pickupDate: rentalPeriod.pickupDate ?? undefined,
			returnDate: rentalPeriod.returnDate ?? undefined,
		},
		{
			enabled: bundleSearchEnabled,
		},
	);

	const products = productQuery.data?.data ?? [];
	const bundles = (bundleQuery.data ?? []).filter((bundle) =>
		normalizedSearch
			? `${bundle.name} ${bundle.description ?? ""}`
					.toLowerCase()
					.includes(normalizedSearch.toLowerCase())
			: true,
	);

	function handleAddProduct(product: RentalProductResponse, quantity: number) {
		if (!tenant?.id || !locationId || !isPeriodReady) {
			return;
		}

		const existingItem = items.find(
			(item) =>
				item.selection.type === "PRODUCT" &&
				item.selection.productTypeId === product.id,
		);
		const mergedQuantity =
			(existingItem?.selection.type === "PRODUCT"
				? existingItem.selection.quantity
				: 0) + quantity;

		addProductItem({
			type: "PRODUCT",
			productTypeId: product.id,
			quantity: mergedQuantity,
			label: product.name,
		});
	}

	function handleAddBundle(bundle: BundleItemResponse) {
		if (!tenant?.id || !locationId || !isPeriodReady) {
			return;
		}

		addBundleItem({
			type: "BUNDLE",
			bundleId: bundle.id,
			label: bundle.name,
		});
	}

	if (!locationId) {
		return <PickerNotice>{copy.pickerLocationRequiredText}</PickerNotice>;
	}

	if (!isPeriodReady) {
		return (
			<PickerNotice>
				Completá el período de alquiler compartido antes de buscar productos o
				combos.
			</PickerNotice>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h3 className="text-base font-semibold">Agregar items</h3>
					<p className="text-sm text-muted-foreground">
						Cada item se agrega con el precio calculado para la locación y el
						periodo compartido del pedido.
					</p>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as ItemTab)}
				>
					<TabsList>
						<TabsTrigger value="ALL">Todos</TabsTrigger>
						<TabsTrigger value="PRODUCT">Productos</TabsTrigger>
						<TabsTrigger value="BUNDLE">Combos</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="relative">
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Buscar productos o combos"
					className="pl-9"
				/>
			</div>

			<div className="space-y-4">
				{activeTab !== "BUNDLE" ? (
					<ProductResultsSection
						products={products}
						currency={tenantCurrency}
						isLoading={productQuery.isFetching}
						isError={productQuery.isError}
						search={normalizedSearch}
						onAdd={handleAddProduct}
					/>
				) : null}

				{activeTab !== "PRODUCT" ? (
					<BundleResultsSection
						bundles={bundles}
						currency={tenantCurrency}
						isLoading={bundleQuery.isFetching}
						isError={bundleQuery.isError}
						search={normalizedSearch}
						onAdd={handleAddBundle}
					/>
				) : null}
			</div>
		</div>
	);
}

function ProductResultsSection({
	products,
	currency,
	isLoading,
	isError,
	search,
	onAdd,
}: {
	products: RentalProductResponse[];
	currency: string;
	isLoading: boolean;
	isError: boolean;
	search: string;
	onAdd: (product: RentalProductResponse, quantity: number) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<h4 className="text-sm font-medium">Productos</h4>
				{isLoading ? (
					<Loader2 className="size-4 animate-spin text-muted-foreground" />
				) : null}
			</div>

			{isError ? (
				<PickerNotice>
					No pudimos cargar los productos disponibles.
				</PickerNotice>
			) : products.length === 0 && !isLoading ? (
				<PickerNotice>
					{search
						? `No encontramos productos para "${search}".`
						: "No hay productos disponibles para este contexto."}
				</PickerNotice>
			) : (
				<div className="space-y-2 rounded-lg border border-border bg-background p-2">
					{products.map((product) => (
						<ProductResultRow
							key={product.id}
							product={product}
							currency={currency}
							onAdd={onAdd}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function BundleResultsSection({
	bundles,
	currency,
	isLoading,
	isError,
	search,
	onAdd,
}: {
	bundles: BundleItemResponse[];
	currency: string;
	isLoading: boolean;
	isError: boolean;
	search: string;
	onAdd: (bundle: BundleItemResponse) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<h4 className="text-sm font-medium">Combos</h4>
				{isLoading ? (
					<Loader2 className="size-4 animate-spin text-muted-foreground" />
				) : null}
			</div>

			{isError ? (
				<PickerNotice>No pudimos cargar los combos disponibles.</PickerNotice>
			) : bundles.length === 0 && !isLoading ? (
				<PickerNotice>
					{search
						? `No encontramos combos para "${search}".`
						: "No hay combos disponibles para este contexto."}
				</PickerNotice>
			) : (
				<div className="space-y-2 rounded-lg border border-border bg-background p-2">
					{bundles.map((bundle) => (
						<BundleResultRow
							key={bundle.id}
							bundle={bundle}
							currency={currency}
							onAdd={onAdd}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function ProductResultRow({
	product,
	currency,
	onAdd,
}: {
	product: RentalProductResponse;
	currency: string;
	onAdd: (product: RentalProductResponse, quantity: number) => void;
}) {
	const [quantity, setQuantity] = useState("1");
	const maxQuantity = product.availableCount;
	const parsedQuantity = Number(quantity);
	const safeQuantity = Number.isFinite(parsedQuantity)
		? maxQuantity === null
			? Math.max(1, Math.trunc(parsedQuantity))
			: Math.min(Math.max(1, Math.trunc(parsedQuantity)), maxQuantity)
		: 1;
	const unitPrice = product.pricingTiers[0]?.pricePerUnit ?? null;
	const isUnavailable = maxQuantity === 0;

	return (
		<div className="flex flex-col gap-3 rounded-md px-3 py-2 md:flex-row md:items-center md:justify-between">
			<div className="min-w-0 space-y-1">
				<p className="truncate text-sm font-medium">{product.name}</p>
				<p className="truncate text-xs text-muted-foreground">
					{product.category?.name ? `${product.category.name} · ` : ""}
					{maxQuantity === null
						? "Disponibilidad sujeta al periodo"
						: `${maxQuantity} disponibles`}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-2 md:justify-end">
				<div className="min-w-24 text-sm font-medium">
					{unitPrice !== null
						? formatMoney(formatNumberAmount(unitPrice), currency)
						: "Sin precio"}
				</div>
				<Input
					type="number"
					min={1}
					max={maxQuantity ?? undefined}
					value={quantity}
					onChange={(event) => setQuantity(event.target.value)}
					className="w-20"
					disabled={isUnavailable}
				/>
				<Button
					type="button"
					size="sm"
					onClick={() => onAdd(product, safeQuantity)}
					disabled={isUnavailable}
				>
					<Plus className="size-4" />
					Agregar
				</Button>
			</div>
		</div>
	);
}

function BundleResultRow({
	bundle,
	currency,
	onAdd,
}: {
	bundle: BundleItemResponse;
	currency: string;
	onAdd: (bundle: BundleItemResponse) => void;
}) {
	const pricePerUnit = bundle.pricingPreview?.pricePerUnit ?? null;

	return (
		<div className="flex flex-col gap-3 rounded-md px-3 py-2 md:flex-row md:items-center md:justify-between">
			<div className="min-w-0 space-y-1">
				<p className="truncate text-sm font-medium">{bundle.name}</p>
				<p className="truncate text-xs text-muted-foreground">
					{bundle.components.length} componentes ·{" "}
					{bundle.isAvailable ? "Disponible" : "No disponible"}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-2 md:justify-end">
				<div className="min-w-24 text-sm font-medium">
					{pricePerUnit !== null
						? formatMoney(formatNumberAmount(pricePerUnit), currency)
						: "Sin precio"}
				</div>
				<Button
					type="button"
					size="sm"
					onClick={() => onAdd(bundle)}
					disabled={!bundle.isAvailable}
				>
					<Plus className="size-4" />
					Agregar
				</Button>
			</div>
		</div>
	);
}

function PickerNotice({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
			<PackageSearch className="size-4 shrink-0" />
			<span>{children}</span>
		</div>
	);
}

function hasCompleteRentalPeriod(rentalPeriod: {
	pickupDate: string | null;
	returnDate: string | null;
	pickupTime: number | null;
	returnTime: number | null;
}) {
	return Boolean(
		rentalPeriod.pickupDate &&
			rentalPeriod.returnDate &&
			rentalPeriod.pickupTime !== null &&
			rentalPeriod.returnTime !== null,
	);
}

function formatNumberAmount(value: number): string {
	return value.toFixed(2);
}
