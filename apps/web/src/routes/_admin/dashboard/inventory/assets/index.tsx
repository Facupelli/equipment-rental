import type { AssetResponseDto, GetAssetsQuery } from "@repo/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useAssets } from "@/features/inventory/assets/assets.queries";
import {
	getAssetColumns,
	getAssetSelectionColumn,
} from "@/features/inventory/assets/components/aseets-columns";
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
	const navigate = useNavigate();
	const locationId = useLocationId();

	const [pagination, setPagination] =
		useState<PaginationState>(DEFAULT_PAGINATION);
	const [filters, setFilters] = useState<GetAssetsQuery>({
		locationId,
	});

	function handleFiltersChange(next: GetAssetsQuery) {
		setFilters(next);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}

	const { data, isFetching } = useAssets({
		...filters,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	function handleEdit(item: AssetResponseDto) {
		// navigate({
		//   to: '/dashboard/inventory/items/$itemId/edit',
		//   params: { itemId: item.id },
		// });
	}

	const columns = [
		getAssetSelectionColumn(),
		...getAssetColumns({ onEdit: handleEdit }),
	];

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Inventory Items
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage your fleet — serialized assets and bulk stock.
				</p>
			</div>

			<AssetsTable
				data={data?.data ?? []}
				meta={data?.meta}
				columns={columns}
				pagination={pagination}
				onPaginationChange={setPagination}
				filters={filters}
				onFiltersChange={handleFiltersChange}
				isFetching={isFetching}
			/>
		</div>
	);
}
