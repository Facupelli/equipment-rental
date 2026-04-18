import type { GetAssetsQuery } from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";
import type { PaginationState } from "@tanstack/react-table";
import { useState } from "react";
import { useAssets } from "@/features/inventory/assets/assets.queries";
import { AssetsTable } from "@/features/inventory/assets/components/assets-table";
import { AdminRouteError } from "@/shared/components/admin-route-error";
import { useLocationId } from "@/shared/contexts/location/location.hooks";

export const Route = createFileRoute("/_admin/dashboard/inventory/assets/")({
	errorComponent: ({ error }) => {
		return (
			<AdminRouteError
				error={error}
				genericMessage="No pudimos cargar el catalogo de assets."
				forbiddenMessage="No tienes permisos para ver los assets."
			/>
		);
	},
	component: AssetsPage,
});

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 20 };

function AssetsPage() {
	const locationId = useLocationId();
	const defaultFilters = { locationId };

	const [pagination, setPagination] =
		useState<PaginationState>(DEFAULT_PAGINATION);
	const [filters, setFilters] = useState<GetAssetsQuery>(defaultFilters);

	function handleFiltersChange(next: GetAssetsQuery) {
		setFilters(next);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}

	const { data, isFetching } = useAssets({
		...filters,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Maneja tu equipo — activos físicos.
				</p>
			</div>

			<AssetsTable
				groups={data?.data ?? []}
				meta={data?.meta}
				pagination={pagination}
				onPaginationChange={setPagination}
				filters={filters}
				defaultFilters={defaultFilters}
				onFiltersChange={handleFiltersChange}
				isFetching={isFetching}
			/>
		</div>
	);
}
