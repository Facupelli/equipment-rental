import { type RentalProductSort, rentalProductSortSchema } from "@repo/schemas";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import z from "zod";
import useDebounce from "@/shared/hooks/use-debounce";

export const rentalPageSearchSchema = z.object({
	locationId: z.string().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	categoryId: z.string().optional(),
	search: z.string().optional(),
	sort: rentalProductSortSchema.optional(),
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
});

export type RentalPageSearch = z.infer<typeof rentalPageSearchSchema>;

export const DEFAULT_RENTAL_PRODUCT_SORT: RentalProductSort = "price-desc";

export function useRentalPageSearch() {
	const search = useSearch({ from: "/_portal/_tenant/rental/" });
	const navigate = useNavigate({ from: "/rental/" });

	const [localSearch, setLocalSearch] = useState(search.search ?? "");
	const debouncedSearch = useDebounce(localSearch, 300);

	const setUrlParam = useCallback(
		(patch: Partial<RentalPageSearch>) => {
			navigate({
				search: (prev) => ({ ...prev, ...patch }),
				resetScroll: false,
				replace: true,
			});
		},
		[navigate],
	);

	// Legitimate useEffect: syncing the URL (external system) with a debounced
	// local state value. There's no event handler that can own this — it fires
	// automatically after the user stops typing.
	useEffect(() => {
		setUrlParam({ search: debouncedSearch || undefined, page: 1 });
	}, [debouncedSearch, setUrlParam]);

	function handleCategorySelect(id: string) {
		const next = search.categoryId === id ? undefined : id;
		setUrlParam({ categoryId: next, page: 1 });
	}

	function handleLocationChange(locationId: string) {
		setUrlParam({ locationId, page: 1 });
	}

	function handleSortChange(sort: RentalProductSort) {
		setUrlParam({ sort, page: 1 });
	}

	return {
		search,
		localSearch,
		setLocalSearch,
		setUrlParam,
		handleCategorySelect,
		handleLocationChange,
		handleSortChange,
	};
}
