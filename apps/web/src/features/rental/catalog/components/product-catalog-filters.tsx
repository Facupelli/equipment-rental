import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRentalCategories } from "@/features/rental/catalog/categories.queries";
import useDebounce from "@/shared/hooks/use-debounce";
import type { RentalProductSort } from "@repo/schemas";
import { Search } from "lucide-react";
import {
	DEFAULT_RENTAL_PRODUCT_SORT,
	type RentalPageSearch,
} from "../hooks/use-catalog-page-search";

interface CategoryFilterProps {
	activeCategory: string | undefined;
	onSelect: (id: string) => void;
}

export function CategoryFilter({
	activeCategory,
	onSelect,
}: CategoryFilterProps) {
	const { data: categories, isFetching } = useRentalCategories();

	if (isFetching) {
		const skeletonKeys = ["one", "two", "three", "four", "five"];

		return (
			<div className="hidden md:flex gap-2 pb-4 border-b">
				{skeletonKeys.map((key) => (
					<Skeleton key={key} className="h-9 w-24 rounded-full" />
				))}
			</div>
		);
	}

	if (!categories?.length) {
		return null;
	}

	return (
		<div className="hidden md:flex gap-2 pb-4 overflow-x-auto border-b scrollbar-hide">
			{categories.map((cat) => (
				<Button
					key={cat.id}
					variant={activeCategory === cat.id ? "default" : "ghost"}
					onClick={() => onSelect(cat.id)}
					className="rounded-full shrink-0"
				>
					{cat.name}
				</Button>
			))}
		</div>
	);
}

const SORT_OPTIONS: Array<{ label: string; value: RentalProductSort }> = [
	{ label: "Mayor precio", value: "price-desc" },
	{ label: "Menor precio", value: "price-asc" },
	{ label: "Alfabético", value: "alphabetical" },
];

interface SearchAndSortFiltersProps {
	search: RentalPageSearch;

	onSortChange: (sort: RentalProductSort) => void;
	onSearchCommit: (value: string) => void;
}

export function SearchAndSortFilters({
	search,
	onSearchCommit,
	onSortChange,
}: SearchAndSortFiltersProps) {
	const [localSearch, setLocalSearch] = useState(search.search ?? "");
	const debouncedSearch = useDebounce(localSearch, 300);

	useEffect(() => {
		setLocalSearch(search.search ?? "");
	}, [search.search]);

	useEffect(() => {
		if (debouncedSearch === (search.search ?? "")) {
			return;
		}

		// The URL update triggers data fetching, so keep it non-urgent and let the
		// current input value stay responsive while results refresh.
		startTransition(() => {
			onSearchCommit(debouncedSearch);
		});
	}, [debouncedSearch, onSearchCommit, search.search]);

	return (
		<div className="flex flex-col md:flex-row md:items-center gap-y-4 justify-between pt-4">
			<div className="relative transition-all flex-1 max-w-md">
				<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Buscar equipo..."
					className="pl-8"
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
				/>
			</div>

			<div className="flex items-center justify-end gap-3">
				<span className="text-sm font-medium text-muted-foreground">
					Ordenar por
				</span>
				<Select
					value={search.sort ?? DEFAULT_RENTAL_PRODUCT_SORT}
					onValueChange={(value) => onSortChange(value as RentalProductSort)}
					items={SORT_OPTIONS}
				>
					<SelectTrigger className="w-44" aria-label="Ordenar por">
						<SelectValue placeholder="Ordenar por" />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
