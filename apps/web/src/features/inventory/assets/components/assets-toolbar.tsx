import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { InventoryItemStatus } from "@repo/types";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useCategories } from "@/features/catalog/product-categories/categories.queries";
import type { GetAssetsQuery } from "@repo/schemas";

const STATUS_OPTIONS: { value: InventoryItemStatus; label: string }[] = [
	{ value: InventoryItemStatus.OPERATIONAL, label: "Operational" },
	{ value: InventoryItemStatus.MAINTENANCE, label: "Maintenance" },
	{ value: InventoryItemStatus.RETIRED, label: "Retired" },
];

interface InventoryItemsToolbarProps {
	filters: GetAssetsQuery;
	onFiltersChange: (filters: GetAssetsQuery) => void;
}

export function AssetsToolbar({
	filters,
	onFiltersChange,
}: InventoryItemsToolbarProps) {
	const { data: categories = [] } = useCategories();
	const { data: locations = [] } = useLocations();

	function set(patch: Partial<GetAssetsQuery>) {
		onFiltersChange({ ...filters, ...patch });
	}

	const hasActiveFilters = !!(
		filters.search ||
		filters.categoryId ||
		filters.locationId ||
		filters.status ||
		filters.includeRetired
	);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Input
				placeholder="Search by serial or name..."
				value={filters.search ?? ""}
				onChange={(e) => set({ search: e.target.value || undefined })}
				className="h-9 w-64"
			/>

			<Select
				value={filters.categoryId ?? ""}
				onValueChange={(val) => set({ categoryId: val || undefined })}
				items={categories.map((c) => ({
					value: c.id,
					label: c.name,
				}))}
			>
				<SelectTrigger className="h-9 w-44">
					<SelectValue placeholder="Category" />
				</SelectTrigger>
				<SelectContent>
					{categories.map((c) => (
						<SelectItem key={c.id} value={c.id}>
							{c.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={filters.locationId ?? ""}
				onValueChange={(val) => set({ locationId: val || undefined })}
				items={locations.map((l) => ({
					value: l.id,
					label: l.name,
				}))}
			>
				<SelectTrigger className="h-9 w-44">
					<SelectValue placeholder="Location" />
				</SelectTrigger>
				<SelectContent>
					{locations.map((l) => (
						<SelectItem key={l.id} value={l.id}>
							{l.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={filters.status ?? ""}
				onValueChange={(val) =>
					set({ status: (val as InventoryItemStatus) || undefined })
				}
				items={STATUS_OPTIONS}
			>
				<SelectTrigger className="h-9 w-40">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					{STATUS_OPTIONS.map((s) => (
						<SelectItem key={s.value} value={s.value}>
							{s.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div className="flex items-center gap-2 ml-1">
				<Switch
					id="include-retired"
					checked={filters.includeRetired ?? false}
					onCheckedChange={(checked) =>
						set({ includeRetired: checked || undefined })
					}
				/>
				<Label
					htmlFor="include-retired"
					className="text-sm text-muted-foreground cursor-pointer"
				>
					Show retired
				</Label>
			</div>

			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onFiltersChange({})}
					className="h-9 px-2 text-muted-foreground"
				>
					<X className="mr-1 h-4 w-4" />
					Clear
				</Button>
			)}
		</div>
	);
}
