import type { GetAssetsQuery } from "@repo/schemas";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/features/catalog/product-types/products.queries";
import { useLocations } from "@/features/tenant/locations/locations.queries";

const ALL_LOCATIONS_VALUE = "all-locations";
const ALL_PRODUCT_TYPES_VALUE = "all-product-types";
const ALL_STATUS_VALUE = "all-statuses";

interface AssetsToolbarProps {
	filters: GetAssetsQuery;
	defaultFilters: GetAssetsQuery;
	onFiltersChange: (filters: GetAssetsQuery) => void;
}

export function AssetsToolbar({
	filters,
	defaultFilters,
	onFiltersChange,
}: AssetsToolbarProps) {
	const { data: locations = [] } = useLocations();
	const { data: productTypesResponse } = useProducts({
		isActive: true,
		limit: 200,
	});

	const productTypes = productTypesResponse?.data ?? [];

	function set(patch: Partial<GetAssetsQuery>) {
		onFiltersChange({ ...filters, ...patch });
	}

	function getOptionalSelectValue(
		value: string | null | undefined,
		emptyValue: string,
	): string | undefined {
		if (value == null || value === emptyValue) {
			return undefined;
		}

		return value;
	}

	const hasActiveFilters =
		(filters.search ?? "") !== (defaultFilters.search ?? "") ||
		filters.locationId !== defaultFilters.locationId ||
		filters.productTypeId !== defaultFilters.productTypeId ||
		filters.isActive !== defaultFilters.isActive;

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Input
				placeholder="Buscar por número de serie o nombre de producto"
				value={filters.search ?? ""}
				onChange={(e) => set({ search: e.target.value || undefined })}
				className="h-9 w-full sm:w-96"
			/>

			<Select
				value={filters.locationId ?? ALL_LOCATIONS_VALUE}
				onValueChange={(value) =>
					set({
						locationId: getOptionalSelectValue(value, ALL_LOCATIONS_VALUE),
					})
				}
				items={locations.map((location) => ({
					value: location.id,
					label: location.name,
				}))}
			>
				<SelectTrigger className="h-9 w-full sm:w-52">
					<SelectValue placeholder="All locations" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_LOCATIONS_VALUE}>All locations</SelectItem>
					{locations.map((location) => (
						<SelectItem key={location.id} value={location.id}>
							{location.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={filters.productTypeId ?? ALL_PRODUCT_TYPES_VALUE}
				onValueChange={(value) =>
					set({
						productTypeId: getOptionalSelectValue(
							value,
							ALL_PRODUCT_TYPES_VALUE,
						),
					})
				}
				items={productTypes.map((productType) => ({
					value: productType.id,
					label: productType.name,
				}))}
			>
				<SelectTrigger className="h-9 w-full sm:w-56">
					<SelectValue placeholder="All product types" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_PRODUCT_TYPES_VALUE}>
						All product types
					</SelectItem>
					{productTypes.map((productType) => (
						<SelectItem key={productType.id} value={productType.id}>
							{productType.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={
					filters.isActive === undefined
						? ALL_STATUS_VALUE
						: filters.isActive
							? "active"
							: "inactive"
				}
				onValueChange={(value) =>
					set({
						isActive:
							value == null || value === ALL_STATUS_VALUE
								? undefined
								: value === "active",
					})
				}
				items={[
					{ value: "active", label: "Active" },
					{ value: "inactive", label: "Inactive" },
				]}
			>
				<SelectTrigger className="h-9 w-full sm:w-40">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_STATUS_VALUE}>All statuses</SelectItem>
					<SelectItem value="active">Active</SelectItem>
					<SelectItem value="inactive">Inactive</SelectItem>
				</SelectContent>
			</Select>

			{hasActiveFilters ? (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onFiltersChange(defaultFilters)}
					className="h-9 px-2 text-muted-foreground"
				>
					<X className="mr-1 h-4 w-4" />
					Clear
				</Button>
			) : null}
		</div>
	);
}
