import {
	type GetOrdersQueryDto,
	getOrdersQuerySchema,
	type OrderListDateLens,
	type OrderListSortBy,
	type OrderListSortDirection,
} from "@repo/schemas";

export const ordersListSearchSchema = getOrdersQuerySchema;

export type OrdersListSearch = GetOrdersQueryDto;

export type OrdersListSort = {
	sortBy: OrderListSortBy;
	sortDirection: OrderListSortDirection;
};

export function getDefaultOrdersSort(
	dateLens?: OrderListDateLens,
): OrdersListSort {
	switch (dateLens) {
		case "UPCOMING":
			return { sortBy: "pickupDate", sortDirection: "asc" };
		case "ACTIVE":
			return { sortBy: "returnDate", sortDirection: "asc" };
		case "PAST":
			return { sortBy: "returnDate", sortDirection: "desc" };
		case "TODAY":
		default:
			return { sortBy: "createdAt", sortDirection: "desc" };
	}
}

export function hasExplicitOrdersSort(search: OrdersListSearch): boolean {
	return Boolean(search.sortBy || search.sortDirection);
}

export function getEffectiveOrdersSort(
	search: OrdersListSearch,
): OrdersListSort {
	const fallback = getDefaultOrdersSort(search.dateLens);

	if (!search.sortBy && !search.sortDirection) {
		return fallback;
	}

	return {
		sortBy: search.sortBy ?? fallback.sortBy,
		sortDirection: search.sortDirection ?? fallback.sortDirection,
	};
}
