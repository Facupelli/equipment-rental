import { type RentalProductSort, rentalProductSortSchema } from "@repo/schemas";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { startTransition, useCallback } from "react";
import z from "zod";

export const rentalPageSearchSchema = z.object({
	locationId: z.string().optional(),
	pickupDate: z.iso.date().optional(),
	returnDate: z.iso.date().optional(),
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

	const setUrlParam = useCallback(
		(patch: Partial<RentalPageSearch>) => {
			startTransition(() => {
				navigate({
					search: (prev) => ({ ...prev, ...patch }),
					resetScroll: false,
					replace: true,
				});
			});
		},
		[navigate],
	);

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
		setUrlParam,
		handleCategorySelect,
		handleLocationChange,
		handleSortChange,
	};
}
